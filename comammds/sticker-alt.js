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
 * Java Bot MD - Comando para Crear Stickers (.sticker / .s)
 * Convierte imágenes o videos en stickers optimizados y de alta calidad para WhatsApp.
 */
async function stickerCommand(sock, chatId, message) {
    let tempFiles = []; // Rastrea todos los archivos temporales para limpiarlos al final

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
                             targetMessage.message?.documentMessage;

        if (!mediaMessage) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎨 *CREAR STICKER* ⊱━━━╮
│
│  Convierte imágenes o videos en 
│  stickers de alta calidad para WhatsApp.
│
│  💡 *Uso:* Responde a una imagen/video 
│  con el comando *.sticker* o *.s*
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
        await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });

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
        const tempInput = path.join(tmpDir, `sticker_in_${uniqueId}`);
        let tempOutput = path.join(tmpDir, `sticker_out_${uniqueId}.webp`);
        
        tempFiles.push(tempInput, tempOutput);
        fs.writeFileSync(tempInput, mediaBuffer);

        // 5. Determinar si es animado y tamaño para compresión inteligente
        const isAnimated = mediaMessage.mimetype?.includes('gif') || 
                           mediaMessage.mimetype?.includes('video') || 
                           (mediaMessage.seconds && mediaMessage.seconds > 0);
        
        const fileSizeKB = mediaBuffer.length / 1024;
        const isLargeFile = fileSizeKB > 5000; // Umbral de 5MB

        // 6. Primer intento de conversión (Calidad estándar)
        let ffmpegCommand = isAnimated
            ? `ffmpeg -y -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`
            : `ffmpeg -y -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => error ? reject(error) : resolve());
        });

        let webpBuffer = fs.readFileSync(tempOutput);

        // 7. Fallback 1: Si es animado y supera 1MB, aplicar compresión agresiva
        if (isAnimated && webpBuffer.length > 1000 * 1024) {
            const tempFallback1 = path.join(tmpDir, `sticker_fb1_${uniqueId}.webp`);
            tempFiles.push(tempFallback1);
            
            const fbCmd = isLargeFile
                ? `ffmpeg -y -i "${tempInput}" -t 2 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=8,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempFallback1}"`
                : `ffmpeg -y -i "${tempInput}" -t 3 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=12,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 45 -compression_level 6 -b:v 150k -max_muxing_queue_size 1024 "${tempFallback1}"`;
            
            await new Promise((resolve, reject) => exec(fbCmd, (err) => err ? reject(err) : resolve()));
            if (fs.existsSync(tempFallback1)) {
                webpBuffer = fs.readFileSync(tempFallback1);
                tempOutput = tempFallback1; // Actualizar ruta para limpieza posterior
            }
        }

        // 8. Añadir metadatos EXIF al sticker (Nombre del paquete, autor, emojis)
        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': PACK_NAME,
            'emojis': ['🤖']
        };

        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exif;
        let finalBuffer = await img.save(null);

        // 9. Fallback 2: Si aún supera 900KB, reducir a resolución mínima (320x320)
        if (isAnimated && finalBuffer.length > 900 * 1024) {
            const tempFallback2 = path.join(tmpDir, `sticker_fb2_${uniqueId}.webp`);
            tempFiles.push(tempFallback2);
            
            const smallCmd = `ffmpeg -y -i "${tempInput}" -t 2 -vf "scale=320:320:force_original_aspect_ratio=decrease,fps=8,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 80k -max_muxing_queue_size 1024 "${tempFallback2}"`;
            
            await new Promise((resolve, reject) => exec(smallCmd, (err) => err ? reject(err) : resolve()));
            if (fs.existsSync(tempFallback2)) {
                const smallWebp = fs.readFileSync(tempFallback2);
                const img2 = new webp.Image();
                await img2.load(smallWebp);
                
                const json2 = {
                    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                    'sticker-pack-name': PACK_NAME,
                    'emojis': ['🤖']
                };
                const exifAttr2 = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                const jsonBuffer2 = Buffer.from(JSON.stringify(json2), 'utf8');
                const exif2 = Buffer.concat([exifAttr2, jsonBuffer2]);
                exif2.writeUIntLE(jsonBuffer2.length, 14, 4);
                
                img2.exif = exif2;
                finalBuffer = await img2.save(null);
            }
        }

        // 10. Enviar el sticker procesado
        await sock.sendMessage(chatId, { 
            sticker: finalBuffer
        }, { quoted: message });

        // 11. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en stickerCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE PROCESAMIENTO* ⊱━━━╮
│
│  No se pudo crear el sticker.
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
        // 12. Limpieza segura de TODOS los archivos temporales (crítico para la salud del servidor)
        for (const file of tempFiles) {
            safeUnlink(file);
        }
    }
}

module.exports = stickerCommand;