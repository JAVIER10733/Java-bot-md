/**
 * Java Bot MD - Gestión de Usuarios Premium
 * Comando exclusivo para el dueño: .premium add, .premium remove, .premium list
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const PREMIUM_FILE = path.join(__dirname, '../data/premiumUsers.json');
const BOT_NAME = global.botname || 'Java Bot MD';

/**
 * Convierte un número o mención en un JID válido de WhatsApp.
 */
function formatToJid(input) {
    // Si ya es un JID completo, lo devolvemos
    if (input.includes('@s.whatsapp.net') || input.includes('@g.us')) return input;
    // Si es una mención (@593999999999), quitamos el @
    const cleanNumber = input.replace('@', '').replace(/\D/g, '');
    return `${cleanNumber}@s.whatsapp.net`;
}

async function premiumCommand(sock, chatId, message, args, isOwner) {
    try {
        // 1. Validar que solo el dueño pueda usarlo
        if (!isOwner) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🔒 *ACCESO RESTRINGIDO* ⊱━━━╮
│
│  Este comando es exclusivo del 
│  propietario del bot.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `${BOT_NAME} · Administración`
            }, { quoted: message });
        }

        const action = args[0]?.toLowerCase();
        const targetInput = args[1];

        // Asegurar que el archivo exista
        const dataDir = path.dirname(PREMIUM_FILE);
        if (!fsSync.existsSync(dataDir)) fsSync.mkdirSync(dataDir, { recursive: true });
        if (!fsSync.existsSync(PREMIUM_FILE)) await fs.writeFile(PREMIUM_FILE, JSON.stringify([], null, 2), 'utf8');

        // 2. Acción: AGREGAR
        if (action === 'add' || action === 'añadir') {
            if (!targetInput) {
                return await sock.sendMessage(chatId, { text: '⚠️ *Uso:* .premium add @usuario o número' }, { quoted: message });
            }
            const jid = formatToJid(targetInput);
            const data = JSON.parse(await fs.readFile(PREMIUM_FILE, 'utf8'));

            if (data.includes(jid)) {
                return await sock.sendMessage(chatId, { text: `⚠️ El usuario _${jid.split('@')[0]}_ ya es Premium.` }, { quoted: message });
            }

            data.push(jid);
            await fs.writeFile(PREMIUM_FILE, JSON.stringify(data, null, 2), 'utf8');

            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 💎 *USUARIO PREMIUM AGREGADO* ⊱━━━╮
│
│  ✅ Se ha otorgado acceso Premium a:
│  👤 *@${jid.split('@')[0]}*
│
│  🚀 Ahora tiene acceso completo a 
│  las herramientas de OSINT.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                mentions: [jid]
            }, { quoted: message });
        }

        // 3. Acción: QUITAR
        if (action === 'remove' || action === 'quitar' || action === 'delete') {
            if (!targetInput) {
                return await sock.sendMessage(chatId, { text: '⚠️ *Uso:* .premium remove @usuario o número' }, { quoted: message });
            }
            const jid = formatToJid(targetInput);
            const data = JSON.parse(await fs.readFile(PREMIUM_FILE, 'utf8'));
            const index = data.indexOf(jid);

            if (index === -1) {
                return await sock.sendMessage(chatId, { text: `⚠️ El usuario _${jid.split('@')[0]}_ no es Premium.` }, { quoted: message });
            }

            data.splice(index, 1);
            await fs.writeFile(PREMIUM_FILE, JSON.stringify(data, null, 2), 'utf8');

            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🚫 *USUARIO PREMIUM ELIMINADO* ⊱━━━╮
│
│  ❌ Se ha revocado el acceso Premium a:
│  👤 *@${jid.split('@')[0]}*
│
│  🔒 Las herramientas de OSINT han 
│  sido bloqueadas para este usuario.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                mentions: [jid]
            }, { quoted: message });
        }

        // 4. Acción: LISTAR
        if (action === 'list' || action === 'lista') {
            const data = JSON.parse(await fs.readFile(PREMIUM_FILE, 'utf8'));
            
            if (data.length === 0) {
                return await sock.sendMessage(chatId, { text: '📭 Actualmente no hay usuarios Premium registrados.' }, { quoted: message });
            }

            const userList = data.map((jid, i) => `  ${i + 1}. @${jid.split('@')[0]}`).join('\n');

            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 👑 *LISTA DE USUARIOS PREMIUM* ⊱━━━╮
│
│  Total de usuarios: *${data.length}*
│
│  📋 *Usuarios activos:*
${userList}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                mentions: data
            }, { quoted: message });
        }

        // 5. Ayuda por defecto
        return await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 💎 *GESTIÓN PREMIUM* ⊱━━━╮
│
│  Comandos disponibles:
│  • *.premium add* @usuario  → Dar acceso
│  • *.premium remove* @usuario → Quitar acceso
│  • *.premium list* → Ver lista de usuarios
│
│  💡 *Ejemplo:* .premium add 593999999999
│  💡 *Ejemplo:* .premium add @593999999999
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `${BOT_NAME} · Administración`
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en premiumCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al gestionar los usuarios Premium.' }, { quoted: message });
    }
}

module.exports = premiumCommand;