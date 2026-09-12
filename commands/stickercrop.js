const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
const PACK_NAME = global.packname || BOT_NAME;

/**
 * Limpia archivos temporales de forma segura para evitar fugas de memoria en el servidor.
 */
function safeUnlink(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.warn('⚠️ No se pudo eliminar archivo temporal:', filePath);
    }
}

/**
 * Java Bot MD - Comando para recortar y convertir a Sticker (.crop / .stickercrop)
 * Convierte imágenes, videos o stickers en stickers cuadrados optimizados para WhatsApp.
 */
async function stickercropCommand(sock, chatId, message) {
    let tempInput = null;
    let tempOutput = null;

    try {
        // 1. Extraer el mensaje citado (soporta mensajes normales y efímeros)
        const ctx = message.message?.extendedTextMessage?.contextInfo || 
                    message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;
        
        let targetMessage = message;
        if (ctx?.quotedMessage) {
            targetMessage = {
                key: {
                    remoteJid: chatId,
                    id: ctx.stanzaId,
                    participant: ctx.participant
                },
                message: ctx.quotedMessage
            };
        }

        const mediaMessage = targetMessage.message?.imageMessage || 
                             targetMessage.message?.videoMessage || 
                             targetMessage.message?.documentMessage || 
                             targetMessage.message?.stickerMessage;

        if (!mediaMessage) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ✂️ *RECORTAR STICKER* ⊱━━━╮
│
│  Convierte imágenes, videos o 
│  stickers en stickers cuadrados 
│  optimizados para WhatsApp.
│
│  💡 *Uso:* Responde a una imagen/video 
│  con el comando *.crop* o *.stickercrop*
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

        // 2. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '✂️', key: message.key } });

        // 3. Descargar el medio de forma segura
        const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, { 
            logger: undefined, 
            reuploadRequest: sock.updateMediaMessage 
        });

        if (!mediaBuffer) {
            throw new Error('No se pudo descargar el medio.');
        }

        // 4. Preparar directorio temporal y archivos con nombres únicos
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        tempInput = path.join(tmpDir, `crop_in_${uniqueId}`);
        tempOutput = path.join(tmpDir, `crop_out_${uniqueId}.webp`);

        fs.writeFileSync(tempInput, mediaBuffer);

        // 5. Determinar si es animado y tamaño para aplicar compresión inteligente
        const isAnimated = mediaMessage.mimetype?.includes('gif') || 
                           mediaMessage.mimetype?.includes('video') || 
                           (mediaMessage.seconds && mediaMessage.seconds > 0);
        
        const fileSizeKB = mediaBuffer.length / 1024;
        const isLargeFile = fileSizeKB > 5000; // Umbral de 5MB

        let ffmpegCommand;
        if (isAnimated) {
            if (isLargeFile) {
                // Video grande: compresión agresiva, máx 2 segundos, baja calidad
                ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t 2 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=8" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempOutput}"`;
            } else {
                // Video normal: compresión estándar, máx 3 segundos
                ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t 3 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=12" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 50 -compression_level 6 -b:v 150k -max_muxing_queue_size 1024 "${tempOutput}"`;
            }
        } else {
            // Imagen: compresión estándar de alta calidad
            ffmpegCommand = `ffmpeg -y -i "${tempInput}" -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,format=rgba" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;
        }

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => error ? reject(error) : resolve());
        });

        if (!fs.existsSync(tempOutput)) {
            throw new Error('FFmpeg no pudo crear el archivo de salida.');
        }

        // 6. Añadir metadatos EXIF al sticker
        let webpBuffer = fs.readFileSync(tempOutput);
        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': PACK_NAME,
            'emojis': ['✂️']
        };

        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exif;
        const finalBuffer = await img.save(null);

        // 7. Enviar el sticker procesado
        await sock.sendMessage(chatId, { 
            sticker: finalBuffer
        }, { quoted: message });

        // 8. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en stickercropCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE PROCESAMIENTO* ⊱━━━╮
│
│  No se pudo recortar y convertir el 
│  medio a sticker.
│
│  💡 *Posibles causas:*
│  • El archivo es demasiado grande o 
│    está corrupto.
│  • FFmpeg no está instalado o falló 
│    en el servidor.
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
    } finally {
        // 9. Limpieza segura de archivos temporales (crítico para la salud del servidor)
        safeUnlink(tempInput);
        safeUnlink(tempOutput);
    }
}

/**
 * Helper: Convierte un buffer de medio crudo a un sticker recortado.
 * (Utilizado internamente por otros comandos como el de Instagram).
 */
async function stickercropFromBuffer(inputBuffer, isAnimated) {
    let tempInput = null;
    let tempOutput = null;

    try {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        tempInput = path.join(tmpDir, `cropbuf_in_${uniqueId}`);
        tempOutput = path.join(tmpDir, `cropbuf_out_${uniqueId}.webp`);

        fs.writeFileSync(tempInput, inputBuffer);

        const fileSizeKB = inputBuffer.length / 1024;
        const isLargeFile = fileSizeKB > 5000;

        let ffmpegCommand;
        if (isAnimated) {
            if (isLargeFile) {
                ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t 2 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=8" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempOutput}"`;
            } else {
                ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t 3 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=12" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 50 -compression_level 6 -b:v 150k -max_muxing_queue_size 1024 "${tempOutput}"`;
            }
        } else {
            ffmpegCommand = `ffmpeg -y -i "${tempInput}" -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,format=rgba" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;
        }

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => error ? reject(error) : resolve());
        });

        const webpBuffer = fs.readFileSync(tempOutput);
        const img = new webp.Image();
        await img.load(webpBuffer);
        
        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': PACK_NAME,
            'emojis': ['✂️']
        };
        
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);
        
        img.exif = exif;
        return await img.save(null);

    } finally {
        // Limpieza garantizada incluso si la función falla
        safeUnlink(tempInput);
        safeUnlink(tempOutput);
    }
}

module.exports = { stickercropCommand, stickercropFromBuffer };