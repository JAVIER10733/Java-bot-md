const fs = require('fs');
const path = require('path');

const WARNINGS_FILE_PATH = path.join(__dirname, '../data/warnings.json');
const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Carga el archivo de advertencias de forma segura y robusta.
 */
function loadWarnings() {
    try {
        const dataDir = path.dirname(WARNINGS_FILE_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        if (!fs.existsSync(WARNINGS_FILE_PATH)) {
            fs.writeFileSync(WARNINGS_FILE_PATH, JSON.stringify({}), 'utf8');
            return {};
        }
        
        const data = fs.readFileSync(WARNINGS_FILE_PATH, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('❌ Error al cargar warnings.json:', error.message);
        return {}; // Fallback seguro para evitar crasheos
    }
}

/**
 * Java Bot MD - Comando para consultar advertencias de un usuario (.warnings)
 */
async function warningsCommand(sock, chatId, message, mentionedJidList) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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
        }

        // 2. Validar que se haya mencionado a un usuario
        if (!mentionedJidList || mentionedJidList.length === 0) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ⚠️ *USUARIO NO ESPECIFICADO* ⊱━━━╮
│
│  Por favor, menciona al usuario que 
│  deseas consultar.
│
│  💡 *Ejemplo:* .warnings @usuario
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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
        }

        // 3. Obtener datos del usuario y cargar advertencias
        const userToCheck = mentionedJidList[0];
        const userName = userToCheck.split('@')[0];
        const warnings = loadWarnings();
        const count = warnings[userToCheck] || 0;

        // 4. Determinar el estado visual según la cantidad de advertencias
        let statusEmoji = '🟢';
        let statusText = 'LIMPIO';
        let statusDesc = 'Este usuario tiene un comportamiento ejemplar.';

        if (count >= 3) {
            statusEmoji = '🔴';
            statusText = 'CRÍTICO';
            statusDesc = 'Este usuario está en riesgo de ser expulsado.';
        } else if (count >= 1) {
            statusEmoji = '🟡';
            statusText = 'ADVERTENCIA';
            statusDesc = 'Este usuario ha infringido las normas recientemente.';
        }

        // 5. Construir el mensaje con diseño de tarjeta premium
        const warningMessage = `╭━━━⊱ 📋 *REGISTRO DE ADVERTENCIAS* ⊱━━━╮
│
│  👤 *Usuario:* @${userName}
│  ⚠️ *Total de Warns:* ${count}
│  📊 *Estado:* ${statusEmoji} *${statusText}*
│
│  📝 *Nota:* ${statusDesc}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 6. Enviar el mensaje con menciones y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: warningMessage,
            mentions: [userToCheck],
            footer: `🤖 ${BOT_NAME} | Moderación segura`,
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

    } catch (error) {
        console.error('❌ Error en warningsCommand:', error);
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al intentar 
│  consultar las advertencias.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Soporte técnico`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Reportar en el Canal',
                    url: CHANNEL_LINK,
                    merchant_url: CHANNEL_LINK
                })
            }],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = warningsCommand;