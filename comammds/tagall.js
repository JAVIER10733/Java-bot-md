const isAdmin = require('../lib/isAdmin');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando para Etiquetar a Todos los Miembros (.tagall)
 * Convoca de forma limpia y organizada a todos los participantes del grupo.
 */
async function tagAllCommand(sock, chatId, senderId, message) {
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
                footer: `🤖 ${BOT_NAME} | Administración`,
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

        // 2. Validar permisos de administrador
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
        
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *PERMISOS INSUFICIENTES* ⊱━━━╮
│
│  Necesito ser *administrador del grupo* 
│  para poder etiquetar a todos los miembros.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Administración`,
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

        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ACCESO DENEGADO* ⊱━━━╮
│
│  Solo los *administradores del grupo* 
│  (o el dueño del bot) pueden usar este 
│  comando de convocatoria.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Administración`,
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

        // 3. Obtener metadatos del grupo
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];

        if (participants.length === 0) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ No se encontraron participantes en este grupo.'
            }, { quoted: message });
        }

        // 4. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '📢', key: message.key } });

        // 5. Construir el mensaje de etiqueta con diseño premium
        const mentionsList = participants.map(p => `  • @${p.id.split('@')[0]}`).join('\n');
        
        const tagMessage = `╭━━━⊱ 📢 *CONVOCATORIA GENERAL* ⊱━━━╮
│
│  Se ha notificado a los *${participants.length}* 
│  miembros del grupo:
│
${mentionsList}
│
│  ⚠️ *Atención:* Por favor, lean los 
│  mensajes importantes de la administración.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 6. Enviar el mensaje con menciones reales y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: tagMessage,
            mentions: participants.map(p => p.id),
            footer: `🤖 ${BOT_NAME} | Administración segura`,
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

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en tagAllCommand:', error);
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al intentar 
│  etiquetar a todos los miembros.
│
│  💡 *Posible causa:* El grupo es 
│  demasiado grande o la conexión es 
│  inestable.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
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

module.exports = tagAllCommand;