const fs = require('fs');
const path = require('path');

/**
 * Lee un archivo JSON de forma segura, devolviendo un fallback si no existe o está corrupto.
 */
function readJsonSafe(filePath, fallback) {
    try {
        if (!fs.existsSync(filePath)) return fallback;
        const txt = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(txt);
    } catch (_) {
        return fallback;
    }
}

/**
 * Java Bot MD - Comando de Configuración Global y de Grupo (.settings)
 * Muestra un panel de control claro con el estado actual de todas las funciones del bot.
 */
async function settingsCommand(sock, chatId, message) {
    try {
        // 1. Validación de seguridad: Solo el dueño del bot
        if (!message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando global. Solo el *dueño del bot* puede usarlo.' 
            }, { quoted: message });
        }

        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        const isGroup = chatId.endsWith('@g.us');
        const dataDir = path.join(__dirname, '..', 'data');

        // 2. Leer configuraciones globales de forma segura
        const mode = readJsonSafe(path.join(dataDir, 'messageCount.json'), { isPublic: true });
        const autoStatus = readJsonSafe(path.join(dataDir, 'autoStatus.json'), { enabled: false });
        const autoread = readJsonSafe(path.join(dataDir, 'autoread.json'), { enabled: false });
        const autotyping = readJsonSafe(path.join(dataDir, 'autotyping.json'), { enabled: false });
        const pmblocker = readJsonSafe(path.join(dataDir, 'pmblocker.json'), { enabled: false });
        const anticall = readJsonSafe(path.join(dataDir, 'anticall.json'), { enabled: false });
        const userGroupData = readJsonSafe(path.join(dataDir, 'userGroupData.json'), {
            antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}, autoReaction: false
        });

        const autoReaction = Boolean(userGroupData.autoReaction);

        // Helper para emojis de estado
        const statusEmoji = (val) => val ? '🟢 *ON*' : '🔴 *OFF*';

        // 3. Construir mensaje de configuración global
        const globalSettings = `╭━━━⊱ ⚙️ *CONFIGURACIÓN GLOBAL* ⊱━━━╮
│
│  🌐 *Modo:* ${mode.isPublic ? 'Público' : 'Privado'}
│  👁️ *Autoread:* ${statusEmoji(autoread.enabled)}
│  ⌨️ *Autotyping:* ${statusEmoji(autotyping.enabled)}
│  📱 *Auto Status:* ${statusEmoji(autoStatus.enabled)}
│  🛡️ *PM Blocker:* ${statusEmoji(pmblocker.enabled)}
│  📞 *Anticall:* ${statusEmoji(anticall.enabled)}
│  💖 *Auto Reaction:* ${statusEmoji(autoReaction)}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 4. Construir mensaje de configuración del grupo (si aplica)
        let groupSettings = '';
        if (isGroup) {
            const groupId = chatId;
            const antilinkCfg = userGroupData.antilink?.[groupId];
            const antibadwordCfg = userGroupData.antibadword?.[groupId];
            const welcomeOn = Boolean(userGroupData.welcome?.[groupId]);
            const goodbyeOn = Boolean(userGroupData.goodbye?.[groupId]);
            const chatbotOn = Boolean(userGroupData.chatbot?.[groupId]);
            const antitagCfg = userGroupData.antitag?.[groupId];

            const alStatus = antilinkCfg?.enabled ? `🟢 *ON* (Acción: ${antilinkCfg.action || 'delete'})` : '🔴 *OFF*';
            const abStatus = antibadwordCfg?.enabled ? `🟢 *ON* (Acción: ${antibadwordCfg.action || 'delete'})` : '🔴 *OFF*';
            const atStatus = antitagCfg?.enabled ? `🟢 *ON* (Acción: ${antitagCfg.action || 'delete'})` : '🔴 *OFF*';

            groupSettings = `
╭━━━⊱ 👥 *CONFIGURACIÓN DEL GRUPO* ⊱━━━╮
│
│  🔗 *Antilink:* ${alStatus}
│  🤬 *Antibadword:* ${abStatus}
│  🏷️ *Antitag:* ${atStatus}
│  👋 *Welcome:* ${statusEmoji(welcomeOn)}
│  🚪 *Goodbye:* ${statusEmoji(goodbyeOn)}
│  🤖 *Chatbot:* ${statusEmoji(chatbotOn)}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
        } else {
            groupSettings = `
╭━━━⊱ ℹ️ *NOTA* ⊱━━━╮
│
│  Las configuraciones específicas 
│  del grupo se mostrarán cuando 
│  uses este comando dentro de uno.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
        }

        const finalMessage = `${globalSettings}${groupSettings}\n\n🤖 *${botName}* | Panel de Control`;

        // 5. Enviar el mensaje con diseño premium y botón CTA
        await sock.sendMessage(chatId, {
            text: finalMessage,
            footer: `🤖 ${botName} | Panel de Control`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en settingsCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al leer la configuración del bot. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

module.exports = settingsCommand;