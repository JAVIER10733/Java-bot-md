const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Ejecuta un comando de sistema de forma segura y silenciosa.
 */
function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

/**
 * Verifica si el directorio actual es un repositorio Git válido.
 */
async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;
    try {
        await run('git --version');
        return true;
    } catch {
        return false;
    }
}

/**
 * Actualiza el bot utilizando Git (recomendado).
 */
async function updateViaGit() {
    const oldRev = (await run('git rev-parse HEAD').catch(() => 'unknown')).trim();
    await run('git fetch --all --prune');
    const newRev = (await run('git rev-parse origin/main')).trim();
    const alreadyUpToDate = oldRev === newRev;
    
    const commits = alreadyUpToDate ? '' : await run(`git log --pretty=format:"• %s" ${oldRev}..${newRev}`).catch(() => '');
    const commitCount = alreadyUpToDate ? 0 : (commits.match(/•/g) || []).length;

    if (!alreadyUpToDate) {
        await run(`git reset --hard ${newRev}`);
        await run('git clean -fd');
    }
    
    return { oldRev, newRev, alreadyUpToDate, commitCount };
}

/**
 * Descarga un archivo con soporte para redirecciones.
 */
function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        try {
            if (visited.has(url) || visited.size > 5) return reject(new Error('Demasiadas redirecciones'));
            visited.add(url);

            const client = url.startsWith('https://') ? require('https') : require('http');
            const req = client.get(url, { headers: { 'User-Agent': `${BOT_NAME}-Updater/1.0`, 'Accept': '*/*' } }, res => {
                if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                    const location = res.headers.location;
                    if (!location) return reject(new Error(`HTTP ${res.statusCode} sin Location`));
                    res.resume();
                    return downloadFile(new URL(location, url).toString(), dest, visited).then(resolve).catch(reject);
                }
                if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => file.close(resolve));
                file.on('error', err => { try { file.close(() => {}); } catch {} fs.unlink(dest, () => reject(err)); });
            });
            req.on('error', err => { fs.unlink(dest, () => reject(err)); });
        } catch (e) { reject(e); }
    });
}

/**
 * Extrae un archivo ZIP usando herramientas nativas del sistema (Multiplataforma).
 */
async function extractZip(zipPath, outDir) {
    if (process.platform === 'win32') {
        await run(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g, '/')}' -Force"`);
        return;
    }
    try { await run('command -v unzip'); await run(`unzip -o '${zipPath}' -d '${outDir}'`); return; } catch {}
    try { await run('command -v 7z'); await run(`7z x -y '${zipPath}' -o'${outDir}'`); return; } catch {}
    try { await run('busybox unzip -h'); await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`); return; } catch {}
    throw new Error("No se encontró herramienta de descompresión (unzip/7z/busybox). Se recomienda usar modo Git.");
}

/**
 * Copia archivos recursivamente ignorando carpetas de runtime.
 */
function copyRecursive(src, dest, ignore = [], relative = '', outList = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.lstatSync(s);
        if (stat.isDirectory()) {
            copyRecursive(s, d, ignore, path.join(relative, entry), outList);
        } else {
            fs.copyFileSync(s, d);
            if (outList) outList.push(path.join(relative, entry).replace(/\\/g, '/'));
        }
    }
}

/**
 * Actualiza el bot descargando un archivo ZIP (Fallback).
 */
async function updateViaZip(zipOverride) {
    const zipUrl = (zipOverride || settings.updateZipUrl || process.env.UPDATE_ZIP_URL || '').trim();
    if (!zipUrl) throw new Error('No hay URL de ZIP configurada. Establece settings.updateZipUrl o UPDATE_ZIP_URL.');
    
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const zipPath = path.join(tmpDir, 'update.zip');
    await downloadFile(zipUrl, zipPath);
    
    const extractTo = path.join(tmpDir, 'update_extract');
    if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
    await extractZip(zipPath, extractTo);

    const entries = fs.readdirSync(extractTo).map(n => path.join(extractTo, n));
    const srcRoot = (entries.find(e => fs.lstatSync(e).isDirectory()) || extractTo);

    const ignore = ['node_modules', '.git', 'session', 'tmp', 'temp', 'data', 'baileys_store.json', 'settings.js'];
    const copied = [];
    
    // Preservar configuración crítica si existe
    let preservedOwner = null, preservedBotOwner = null;
    try {
        const currentSettings = require('../settings');
        preservedOwner = currentSettings?.ownerNumber ? String(currentSettings.ownerNumber) : null;
        preservedBotOwner = currentSettings?.botOwner ? String(currentSettings.botOwner) : null;
    } catch {}

    copyRecursive(srcRoot, process.cwd(), ignore, '', copied);

    // Restaurar configuración crítica en el nuevo settings.js si fue sobrescrito
    if (preservedOwner) {
        try {
            const settingsPath = path.join(process.cwd(), 'settings.js');
            if (fs.existsSync(settingsPath)) {
                let text = fs.readFileSync(settingsPath, 'utf8');
                text = text.replace(/ownerNumber:\s*['"][^'"]*['"]/, `ownerNumber: '${preservedOwner}'`);
                if (preservedBotOwner) text = text.replace(/botOwner:\s*['"][^'"]*['"]/, `botOwner: '${preservedBotOwner}'`);
                fs.writeFileSync(settingsPath, text);
            }
        } catch {}
    }

    try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(zipPath, { force: true }); } catch {}
    
    return { copiedFiles: copied };
}

/**
 * Reinicia el proceso del bot de forma elegante.
 */
async function restartProcess(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '🔄 *Reiniciando el sistema...*' }, { quoted: message });
    } catch {}
    
    try {
        await run('pm2 restart all'); // Intentar reinicio vía PM2 primero
        return;
    } catch {}
    
    // Fallback: Salir del proceso (los paneles de hosting lo reinician automáticamente)
    setTimeout(() => process.exit(0), 1000);
}

/**
 * Java Bot MD - Comando de Actualización del Sistema (.update)
 * Actualiza el bot vía Git o ZIP, preserva la configuración y reinicia automáticamente.
 */
async function updateCommand(sock, chatId, message, senderIsSudo, zipOverride) {
    try {
        // 1. Validación de seguridad estricta
        if (!message.key.fromMe && !senderIsSudo) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando de mantenimiento global. Solo el *dueño o sudo* del bot puede usarlo.' 
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 🔄 *ACTUALIZANDO SISTEMA* ⊱━━━╮
│
│  ⏳ Buscando nuevas actualizaciones...
│  📂 Verificando integridad de archivos.
│  🔒 Preservando configuración crítica.
│
│  Por favor, no apagues el bot.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Mantenimiento`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: CHANNEL_LINK,
                    merchant_url: CHANNEL_LINK
                })
            }],
            headerType: 1
        }, { quoted: message });

        // 2. Ejecutar lógica de actualización
        if (await hasGitRepo()) {
            const { alreadyUpToDate, newRev, commitCount } = await updateViaGit();
            
            if (alreadyUpToDate) {
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ ✅ *SISTEMA AL DÍA* ⊱━━━╮
│
│  🎉 Tu bot ya está en la última 
│  versión disponible.
│
│  🔖 *Commit actual:* ${newRev.substring(0, 7)}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${BOT_NAME} | Mantenimiento`,
                    buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: CHANNEL_LINK, merchant_url: CHANNEL_LINK }) }],
                    headerType: 1
                }, { quoted: message });
            }
            
            await run('npm install --no-audit --no-fund --silent');
        } else {
            await updateViaZip(zipOverride);
            await run('npm install --no-audit --no-fund --silent');
        }

        // 3. Mensaje de éxito y reinicio
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 🚀 *ACTUALIZACIÓN COMPLETADA* ⊱━━━╮
│
│  ✅ Archivos actualizados correctamente.
│  📦 Dependencias de Node.js instaladas.
│  🔒 Configuración preservada con éxito.
│
│  El bot se reiniciará automáticamente 
│  en unos segundos para aplicar los cambios.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Mantenimiento`,
            buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: CHANNEL_LINK, merchant_url: CHANNEL_LINK }) }],
            headerType: 1
        }, { quoted: message });

        await restartProcess(sock, chatId, message);

    } catch (error) {
        console.error('❌ Error en updateCommand:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *FALLO EN LA ACTUALIZACIÓN* ⊱━━━╮
│
│  Ocurrió un error inesperado durante 
│  el proceso de actualización.
│
│  📝 *Detalle:* ${error.message || 'Error desconocido'}
│
│  💡 *Consejo:* Verifica tu conexión a 
│  internet o los permisos de la carpeta.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Soporte técnico`,
            buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Reportar en el Canal', url: CHANNEL_LINK, merchant_url: CHANNEL_LINK }) }],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = updateCommand;