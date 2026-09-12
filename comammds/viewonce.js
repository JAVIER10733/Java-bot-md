const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando de Vista Única (.vv / .viewonce)
 * Permite ver y guardar el contenido de mensajes de "vista única" (imágenes o videos).
 */
async function viewonceCommand(sock, chatId, message) {
    try {
        // 1. Extraer el mensaje citado (soporta mensajes normales y efímeros)
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                       message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                       message.message; // Fallback por si el comando se aplica al mensaje directamente

        // 2. Identificar si es una imagen o video de vista única
        const viewOnceImage = quoted.imageMessage?.viewOnce ? quoted.imageMessage : null;
        const viewOnceVideo = quoted.videoMessage?.viewOnce ? quoted.videoMessage : null;

        // 3. Validar que sea un contenido de vista única
        if (!viewOnceImage && !viewOnceVideo) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 👁️ *VISTA ÚNICA (VV)* ⊱━━━╮
│
│  Este comando permite recuperar 
│  el contenido de mensajes de 
│  "vista única" (imágenes o videos).
│
│  💡 *Uso:* Responde al mensaje de 
│  vista única con el comando *.vv*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Utilidades`,
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

        // 4. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '👁️', key: message.key } });

        // 5. Procesar y descargar el contenido
        if (viewOnceImage) {
            const stream = await downloadContentFromMessage(viewOnceImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const caption = viewOnceImage.caption 
                ? `👁️ *Contenido recuperado:*\n\n${viewOnceImage.caption}` 
                : '👁️ *Contenido de Vista Única recuperado exitosamente.*';

            await sock.sendMessage(chatId, {
                image: buffer,
                caption: caption
            }, { quoted: message });

        } else if (viewOnceVideo) {
            const stream = await downloadContentFromMessage(viewOnceVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const caption = viewOnceVideo.caption 
                ? `👁️ *Contenido recuperado:*\n\n${viewOnceVideo.caption}` 
                : '👁️ *Contenido de Vista Única recuperado exitosamente.*';

            await sock.sendMessage(chatId, {
                video: buffer,
                caption: caption,
                mimetype: viewOnceVideo.mimetype || 'video/mp4'
            }, { quoted: message });
        }

        // 6. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en viewonceCommand:', error.message);
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE RECUPERACIÓN* ⊱━━━╮
│
│  No se pudo descargar el contenido 
│  de vista única.
│
│  💡 *Posibles causas:*
│  • El mensaje ya fue eliminado por 
│    el remitente.
│  • El archivo está corrupto o la 
│    conexión es inestable.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
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

module.exports = viewonceCommand;