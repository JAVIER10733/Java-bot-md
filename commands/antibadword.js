const { handleAntiBadwordCommand } = require('../lib/antibadword');
const isAdminHelper = require('../lib/isAdmin');
async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este comando solo se puede usar en grupos.' 
            }, { quoted: message });
        }
        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Lo siento, solo los *administradores del grupo* pueden configurar el filtro de malas palabras.' 
            }, { quoted: message });
        }
        const { isBotAdmin } = await isAdminHelper(sock, chatId, senderId, message);
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Necesito ser *administrador del grupo* para poder detectar y borrar malas palabras.\n💡 Por favor, asígneme permisos de admin.' 
            }, { quoted: message });
        }
        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || '';
        const match = text.split(' ').slice(1).join(' ').trim();
        await handleAntiBadwordCommand(sock, chatId, message, match);
    } catch (error) {
        console.error('❌ Error en antibadwordCommand:', error);
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        await sock.sendMessage(chatId, {
            text: `❌ *Error al procesar el comando antibadword*\n\nOcurrió un problema inesperado al configurar el filtro de malas palabras. Por favor, inténtalo de nuevo en unos segundos.\n\n🤖 *${botName}*`,
            footer: '🛡️ Sistema de Moderación',
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Reportar en el Canal',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }
            ],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = antibadwordCommand;