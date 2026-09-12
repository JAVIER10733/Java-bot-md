const sharp = require('sharp');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando para convertir Sticker a Imagen (.simage / .toimg)
 * Extrae el sticker y lo convierte en una imagen PNG de alta calidad al instante.
 */
async function simageCommand(sock, chatId, message) {
    try {
        // 1. Extraer el mensaje citado (soporta mensajes normales y efímeros)
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                       message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // 2. Validar que sea un sticker
        if (!quoted?.stickerMessage) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🖼️ *STICKER A IMAGEN* ⊱━━━╮
│
│  Convierte cualquier sticker de 
│  WhatsApp en una imagen PNG nítida 
│  y de alta calidad.
│
│  💡 *Uso:* Responde a un sticker 
│  con el comando *.simage* o *.toimg*
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

        // 3. Advertencia para stickers animados (GIFs)
        if (quoted.stickerMessage.isAnimated) {
            await sock.sendMessage(chatId, { 
                text: '⚠️ *Nota:* Este es un sticker animado. Se extraerá solo el primer fotograma como imagen estática.' 
            }, { quoted: message });
        }

        // 4. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🖼️', key: message.key } });

        // 5. Descargar el sticker directamente en memoria (Cero uso de disco duro)
        const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
        let stickerBuffer = Buffer.from([]);
        for await (const chunk of stream) {
            stickerBuffer = Buffer.concat([stickerBuffer, chunk]);
        }

        // 6. Convertir WebP a PNG usando Sharp (Procesamiento ultra rápido en RAM)
        const imageBuffer = await sharp(stickerBuffer)
            .toFormat('png')
            .toBuffer();

        // 7. Enviar la imagen resultante con diseño premium y botón CTA
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `╭━━━⊱ ✅ *CONVERSIÓN EXITOSA* ⊱━━━╮
│
│  🖼️ *Formato:* PNG (Alta calidad)
│  🎨 *Fondo:* Transparente
│
│  ✨ Tu imagen está lista para ser 
│  guardada o editada.
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

        // 8. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en simageCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE CONVERSIÓN* ⊱━━━╮
│
│  No se pudo convertir el sticker a 
│  imagen en este momento.
│
│  💡 *Posibles causas:*
│  • El sticker está corrupto.
│  • El formato WebP es incompatible 
│    con el motor de procesamiento.
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

module.exports = simageCommand;