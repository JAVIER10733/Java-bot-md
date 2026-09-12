const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

/**
 * Java Bot MD - Comando de Desenfoque (.blur)
 * Aplica un efecto de desenfoque (blur) profesional a una imagen usando la librería Sharp.
 */
async function blurCommand(sock, chatId, message, quotedMessage) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Determinar de dónde obtener la imagen (mensaje citado o mensaje actual)
        const targetMessage = quotedMessage || 
                              message.message?.ephemeralMessage?.message || 
                              message.message;

        const imageMessage = targetMessage?.imageMessage;

        // 2. Validar que haya una imagen para procesar
        if (!imageMessage) {
            const helpMessage = `╭━━━⊱ 🌫️ *EFECTO DESENFOQUE* ⊱━━━╮
│
│  Aplica un efecto de desenfoque
│  (blur) a cualquier imagen.
│
│  💡 *Uso:*
│  • Responde a una imagen con .blur
│  • O envía una imagen con el texto .blur
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Edición de imágenes`,
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
        }

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🌫️', key: message.key } });

        // 4. Descargar la imagen de forma segura (acumulando chunks)
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let imageBuffer = Buffer.from([]);
        for await (const chunk of stream) {
            imageBuffer = Buffer.concat([imageBuffer, chunk]);
        }

        // 5. Procesar la imagen con Sharp (Redimensionar + Blur)
        // Redimensionamos a un máximo de 800x800 para optimizar el peso sin perder calidad visible
        const processedImage = await sharp(imageBuffer)
            .resize(800, 800, { 
                fit: 'inside',
                withoutEnlargement: true
            })
            .blur(10) // Radio de desenfoque (10 es un valor equilibrado y estético)
            .jpeg({ quality: 85 }) // Convertimos a JPEG para reducir el peso final
            .toBuffer();

        // 6. Enviar la imagen procesada con diseño premium y botón CTA
        await sock.sendMessage(chatId, {
            image: processedImage,
            caption: `╭━━━⊱ 🌫️ *IMAGEN DESENFOCADA* ⊱━━━╮
│
│  ✨ El efecto de desenfoque ha sido
│  aplicado exitosamente.
│
│  🎨 *Procesado por:* ${botName}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Edición de imágenes`,
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

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en blurCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE PROCESAMIENTO* ⊱━━━╮
│
│  No se pudo aplicar el efecto de
│  desenfoque a la imagen.
│
│  💡 *Posibles razones:*
│  • La imagen está corrupta.
│  • La librería Sharp no está instalada.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Soporte técnico`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Reportar en el Canal',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = blurCommand;