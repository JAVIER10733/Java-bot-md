const fs = require('fs');
const path = require('path');

/**
 * Java Bot MD - Comando de Limpieza de Sesión (.clearsession)
 * Elimina archivos temporales de la sesión para optimizar el rendimiento sin perder la autenticación.
 */
async function clearSessionCommand(sock, chatId, msg) {
    try {
        // 1. Validación de seguridad: Solo el dueño del bot
        if (!msg.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando global. Solo el *dueño del bot* puede usarlo.' 
            }, { quoted: msg });
        }

        const sessionDir = path.join(__dirname, '../session');
        if (!fs.existsSync(sessionDir)) {
            return await sock.sendMessage(chatId, { 
                text: '❌ No se encontró el directorio de sesión (`./session`).' 
            }, { quoted: msg });
        }

        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 2. Mensaje inicial de proceso
        await sock.sendMessage(chatId, { 
            text: '🧹 *Optimizando archivos de sesión...*' 
        }, { quoted: msg });

        const files = fs.readdirSync(sessionDir);
        let filesCleared = 0;
        let appStateSyncCount = 0;
        let preKeyCount = 0;
        let errors = 0;

        // 3. Procesar y eliminar archivos de forma segura
        for (const file of files) {
            // 🔒 PROTECCIÓN CRÍTICA: Nunca eliminar creds.json
            if (file === 'creds.json') continue;
            
            if (file.startsWith('app-state-sync-')) appStateSyncCount++;
            if (file.startsWith('pre-key-')) preKeyCount++;
            
            try {
                fs.unlinkSync(path.join(sessionDir, file));
                filesCleared++;
            } catch (err) {
                errors++;
                console.warn(`⚠️ No se pudo eliminar ${file}:`, err.message);
            }
        }

        // 4. Mensaje de éxito con diseño premium y botón CTA
        const successMessage = `╭━━━⊱ 🧹 *LIMPIEZA DE SESIÓN* ⊱━━━╮
│
│  ✅ Archivos eliminados: *${filesCleared}*
│  🔄 App State Sync: *${appStateSyncCount}*
│  🔑 Pre-Keys: *${preKeyCount}*
│  ⚠️ Errores: *${errors}*
│
│  🛡️ *Nota:* El archivo 'creds.json' ha sido
│  protegido para mantener tu sesión activa.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: successMessage,
            footer: `🤖 ${botName} | Mantenimiento del sistema`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: msg });

    } catch (error) {
        console.error('❌ Error en clearSessionCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error inesperado al limpiar los archivos de sesión.' 
        }, { quoted: msg });
    }
}

module.exports = clearSessionCommand;