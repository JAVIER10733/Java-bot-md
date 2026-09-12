const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const webp = require('node-webpmux');
const crypto = require('crypto');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando para Cambiar Paquete de Sticker (.take)
 * Permite cambiar el nombre del paquete y el autor de un sticker existente.
 */
async function takeCommand(sock, chatId, message, args) {
    try {
        // 1. Extraer el mensaje citado (soporta mensajes normales y efímeros)
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                       message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted?.stickerMessage) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎨 *CAMBIAR PAQUETE DE STICKER* ⊱━━━╮
│
│  Cambia el nombre del paquete y 
│  el autor de un sticker existente.
│
│  💡 *Uso:* Responde a un sticker con:
│  .take <Nombre del Paquete>
│  💡 *Ejemplo:* .take Java Bot MD
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Creatividad`,
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

        // 2. Obtener el nombre del paquete (o usar el nombre del bot por defecto)
        const packname = args.join(' ').trim() || BOT_NAME;

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });

        // 4. Descargar el sticker original de forma segura
        const stanzaId = message.message?.extendedTextMessage?.contextInfo?.stanzaId || 
                         message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.stanzaId;

        const stickerBuffer = await downloadMediaMessage(
            {
                key: { id: stanzaId },
                message: quoted,
                messageType: 'stickerMessage'
            },
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: sock.updateMediaMessage
            }
        );

        if (!stickerBuffer) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, { 
                text: '❌ No se pudo descargar el sticker. Inténtalo de nuevo.' 
            }, { quoted: message });
        }

        // 5. Modificar los metadatos EXIF del sticker
        const img = new webp.Image();
        await img.load(stickerBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': packname,
            'sticker-pack-publisher': BOT_NAME,
            'emojis': ['🤖']
        };

        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exif;
        const finalBuffer = await img.save(null);

        // 6. Enviar el nuevo sticker con los metadatos actualizados
        await sock.sendMessage(chatId, {
            sticker: finalBuffer
        }, { quoted: message });

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en takeCommand:', error);
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE PROCESAMIENTO* ⊱━━━╮
│
│  Ocurrió un problema al intentar 
│  cambiar los metadatos del sticker.
│
│  💡 *Posible causa:* El sticker original 
│  está corrupto o la conexión es inestable.
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

module.exports = takeCommand;