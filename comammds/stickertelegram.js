const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const webp = require('node-webpmux');
const crypto = require('crypto');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7801479976:AAGuPL0a7kXXBYz6XUSR_ll2SR5V_W6oHl4';
const MAX_STICKERS_PER_PACK = 30; // Límite de seguridad para evitar rate-limits de WhatsApp

/**
 * Java Bot MD - Comando de Stickers de Telegram (.tg)
 * Descarga y convierte paquetes de stickers de Telegram a formato WhatsApp.
 */
async function stickerTelegramCommand(sock, chatId, message) {
    let tempFiles = []; // Para rastrear y limpiar archivos en caso de error
    
    try {
        // 1. Extraer y validar la URL
        const text = message.message?.conversation?.trim() || message.message?.extendedTextMessage?.text?.trim() || '';
        const args = text.split(' ').slice(1);
        
        if (!args[0] || !args[0].match(/https?:\/\/t\.me\/addstickers\/[a-zA-Z0-9_]+/i)) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 📦 *STICKERS DE TELEGRAM* ⊱━━━╮
│
│  Descarga paquetes de stickers de 
│  Telegram y conviértelos a WhatsApp.
│
│  💡 *Uso:* .tg <url_del_paquete>
│  💡 *Ejemplo:* .tg https://t.me/addstickers/mypack
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

        const packName = args[0].replace("https://t.me/addstickers/", "").replace("http://t.me/addstickers/", "");

        // 2. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '📦', key: message.key } });

        // 3. Obtener información del paquete de stickers
        const apiUrl = `https://api.telegram.org/bot${TG_BOT_TOKEN}/getStickerSet?name=${encodeURIComponent(packName)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        let response;
        try {
            response = await fetch(apiUrl, { 
                signal: controller.signal,
                headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" }
            });
            clearTimeout(timeoutId);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw new Error('Tiempo de espera agotado al conectar con Telegram.');
        }

        if (!response.ok) {
            throw new Error(`La API de Telegram respondió con estado: ${response.status}`);
        }

        const stickerSet = await response.json();
        if (!stickerSet.ok || !stickerSet.result) {
            throw new Error('Paquete de stickers inválido o no encontrado.');
        }

        const totalStickers = stickerSet.result.stickers.length;
        const stickersToProcess = Math.min(totalStickers, MAX_STICKERS_PER_PACK);
        const isTruncated = totalStickers > MAX_STICKERS_PER_PACK;

        // 4. Mensaje de inicio de descarga
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ⏳ *INICIANDO DESCARGA* ⊱━━━╮
│
│  📦 *Paquete:* ${stickerSet.result.name}
│  🎨 *Total:* ${totalStickers} stickers
│  📥 *A procesar:* ${stickersToProcess} 
│     ${isTruncated ? '(Límite de seguridad: 30)' : ''}
│
│  ⏱️ Por favor, espera. Esto puede 
│  tomar unos minutos.
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

        // 5. Preparar directorio temporal
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        let successCount = 0;

        // 6. Procesar cada sticker
        for (let i = 0; i < stickersToProcess; i++) {
            try {
                const sticker = stickerSet.result.stickers[i];
                const fileId = sticker.file_id;
                
                // Obtener ruta del archivo
                const fileInfoRes = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/getFile?file_id=${fileId}`);
                const fileData = await fileInfoRes.json();
                if (!fileData.ok || !fileData.result?.file_path) continue;

                // Descargar sticker
                const fileUrl = `https://api.telegram.org/file/bot${TG_BOT_TOKEN}/${fileData.result.file_path}`;
                const imageResponse = await fetch(fileUrl);
                const imageBuffer = await imageResponse.buffer();

                // Rutas temporales únicas
                const uniqueId = `${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`;
                const tempInput = path.join(tmpDir, `tg_in_${uniqueId}`);
                const tempOutput = path.join(tmpDir, `tg_out_${uniqueId}.webp`);
                
                tempFiles.push(tempInput, tempOutput);
                fs.writeFileSync(tempInput, imageBuffer);

                // Determinar si es animado
                const isAnimated = sticker.is_animated || sticker.is_video;
                
                // Comando FFmpeg optimizado
                const ffmpegCommand = isAnimated
                    ? `ffmpeg -y -i "${tempInput}" -t 3 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=12,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 60 -compression_level 6 -b:v 150k "${tempOutput}"`
                    : `ffmpeg -y -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

                await new Promise((resolve, reject) => {
                    exec(ffmpegCommand, (error) => error ? reject(error) : resolve());
                });

                // Leer y añadir metadatos EXIF
                const webpBuffer = fs.readFileSync(tempOutput);
                const img = new webp.Image();
                await img.load(webpBuffer);

                const metadata = {
                    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                    'sticker-pack-name': global.botname || 'Java Bot MD',
                    'emojis': sticker.emoji ? [sticker.emoji] : ['🤖']
                };

                const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                const jsonBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
                const exif = Buffer.concat([exifAttr, jsonBuffer]);
                exif.writeUIntLE(jsonBuffer.length, 14, 4);
                
                img.exif = exif;
                const finalBuffer = await img.save(null);

                // Enviar sticker
                await sock.sendMessage(chatId, { sticker: finalBuffer }, { quoted: message });
                successCount++;

                // Pequeña pausa para evitar rate-limit de WhatsApp
                await new Promise(r => setTimeout(r, 800));

            } catch (err) {
                console.error(`⚠️ Error procesando sticker ${i + 1}:`, err.message);
                continue; // Continuar con el siguiente si uno falla
            }
        }

        // 7. Mensaje de finalización con diseño premium y botón CTA
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 🎉 *DESCARGA COMPLETADA* ⊱━━━╮
│
│  📦 *Paquete:* ${stickerSet.result.name}
│  ✅ *Exitosos:* ${successCount} / ${stickersToProcess}
│
│  🤖 ¡Tus stickers están listos para 
│  ser usados en WhatsApp!
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
        });

    } catch (error) {
        console.error('❌ Error en stickerTelegramCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE PROCESAMIENTO* ⊱━━━╮
│
│  No se pudo descargar el paquete de 
│  stickers.
│
│  💡 *Posibles causas:*
│  • La URL es incorrecta o el paquete 
│    es privado.
│  • El servidor de Telegram está 
│    saturado.
│  • El token del bot de Telegram es 
│    inválido.
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
        // 8. Limpieza agresiva de archivos temporales (crítico para la salud del servidor)
        for (const file of tempFiles) {
            try {
                if (fs.existsSync(file)) fs.unlinkSync(file);
            } catch (err) {
                console.warn('⚠️ No se pudo eliminar archivo temporal:', file);
            }
        }
    }
}

module.exports = stickerTelegramCommand;