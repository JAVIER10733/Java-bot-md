const { igdl } = require('ruhend-scraper');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');
const settings = require('../settings');
const { stickercropFromBuffer } = require('./stickercrop');

const BOT_NAME = global.botname || settings.packname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Convierte un buffer de imagen/video a WebP optimizado para stickers de WhatsApp.
 */
async function convertBufferToStickerWebp(inputBuffer, isAnimated, cropSquare) {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const randomId = Math.random().toString(36).substring(2, 10);
    const tempInputBase = path.join(tmpDir, `igs_${randomId}`);
    const tempInput = isAnimated ? `${tempInputBase}.mp4` : `${tempInputBase}.jpg`;
    const tempOutput = path.join(tmpDir, `igs_out_${randomId}.webp`);

    fs.writeFileSync(tempInput, inputBuffer);

    const filesToDelete = [tempInput, tempOutput];
    const scheduleDelete = (p) => {
        if (!p) return;
        setTimeout(() => { try { fs.unlinkSync(p); } catch {} }, 5000);
    };

    const vfCropSquareImg = "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512";
    const vfPadSquareImg = "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000";

    let ffmpegCommand;
    if (isAnimated) {
        const isLargeVideo = inputBuffer.length > (5 * 1024 * 1024);
        const maxDuration = isLargeVideo ? 2 : 3;
        if (cropSquare) {
            ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t ${maxDuration} -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=${isLargeVideo ? 8 : 12}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality ${isLargeVideo ? 30 : 50} -compression_level 6 -b:v ${isLargeVideo ? '100k' : '150k'} -max_muxing_queue_size 1024 "${tempOutput}"`;
        } else {
            ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t ${maxDuration} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=${isLargeVideo ? 8 : 12}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality ${isLargeVideo ? 35 : 45} -compression_level 6 -b:v ${isLargeVideo ? '100k' : '150k'} -max_muxing_queue_size 1024 "${tempOutput}"`;
        }
    } else {
        const vf = `${cropSquare ? vfCropSquareImg : vfPadSquareImg},format=rgba`;
        ffmpegCommand = `ffmpeg -y -i "${tempInput}" -vf "${vf}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;
    }

    await new Promise((resolve, reject) => {
        exec(ffmpegCommand, (error) => error ? reject(error) : resolve());
    });

    let webpBuffer = fs.readFileSync(tempOutput);
    
    // Compresión agresiva si supera 1MB
    if (isAnimated && webpBuffer.length > 1000 * 1024) {
        try {
            const tempOutput2 = path.join(tmpDir, `igs_out2_${randomId}.webp`);
            filesToDelete.push(tempOutput2);
            const harsherCmd = cropSquare
                ? `ffmpeg -y -i "${tempInput}" -t 2 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=8" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempOutput2}"`
                : `ffmpeg -y -i "${tempInput}" -t 2 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=8" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 35 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempOutput2}"`;
            
            await new Promise((resolve, reject) => exec(harsherCmd, (err) => err ? reject(err) : resolve()));
            if (fs.existsSync(tempOutput2)) webpBuffer = fs.readFileSync(tempOutput2);
        } catch {}
    }

    const img = new webp.Image();
    await img.load(webpBuffer);

    const json = {
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': BOT_NAME,
        'sticker-pack-publisher': '📸 Instagram Stickers',
        'emojis': ['📸']
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exif;

    let finalBuffer = await img.save(null);

    // Compresión extrema de último recurso (< 900KB)
    if (finalBuffer.length > 900 * 1024) {
        try {
            const tempOutput3 = path.join(tmpDir, `igs_out3_${randomId}.webp`);
            filesToDelete.push(tempOutput3);
            const vfSmall = cropSquare
                ? `crop=min(iw\\,ih):min(iw\\,ih),scale=320:320${isAnimated ? ',fps=8' : ''}`
                : `scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=#00000000${isAnimated ? ',fps=8' : ''}`;
            const cmdSmall = `ffmpeg -y -i "${tempInput}" ${isAnimated ? '-t 2' : ''} -vf "${vfSmall}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality ${isAnimated ? 28 : 65} -compression_level 6 -b:v 80k -max_muxing_queue_size 1024 "${tempOutput3}"`;
            
            await new Promise((resolve, reject) => exec(cmdSmall, (err) => err ? reject(err) : resolve()));
            if (fs.existsSync(tempOutput3)) {
                const smallWebp = fs.readFileSync(tempOutput3);
                const img2 = new webp.Image();
                await img2.load(smallWebp);
                img2.exif = exif; // Reutilizar EXIF
                finalBuffer = await img2.save(null);
            }
        } catch {}
    }

    filesToDelete.forEach(scheduleDelete);
    return finalBuffer;
}

/**
 * Descarga el buffer de una URL con reintentos inteligentes.
 */
async function fetchBufferFromUrl(url) {
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': '*/*', 'Accept-Encoding': 'identity' },
            timeout: 30000, maxContentLength: Infinity, maxBodyLength: Infinity,
            validateStatus: s => s >= 200 && s < 400
        });
        return Buffer.from(res.data);
    } catch (e1) {
        try {
            const res = await axios.get(url, {
                responseType: 'stream',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': '*/*' },
                timeout: 40000, maxContentLength: Infinity, maxBodyLength: Infinity,
                validateStatus: s => s >= 200 && s < 400
            });
            const chunks = [];
            await new Promise((resolve, reject) => {
                res.data.on('data', c => chunks.push(c)).on('end', resolve).on('error', reject);
            });
            return Buffer.concat(chunks);
        } catch (e2) {
            throw new Error(`Fallo en la descarga: ${e1.message} | ${e2.message}`);
        }
    }
}

/**
 * Comando principal para stickers de Instagram (.igs / .igsc)
 */
async function igsCommand(sock, chatId, message, crop = false) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const urlMatch = text.match(/https?:\/\/\S+/);
        
        if (!urlMatch) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 📸 *STICKER DE INSTAGRAM* ⊱━━━╮
│
│  Convierte reels, fotos o carruseles
│  de Instagram en stickers de WhatsApp.
│
│  💡 *Uso:* .igs <enlace>
│  💡 *Uso (recortado):* .igsc <enlace>
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Creatividad`,
                buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: CHANNEL_LINK, merchant_url: CHANNEL_LINK }) }],
                headerType: 1
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        const downloadData = await igdl(urlMatch[0]).catch(() => null);
        if (!downloadData || !downloadData.data) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  No se pudo obtener el contenido.
│  Verifica que el enlace sea válido y
│  que el perfil no sea privado.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Soporte`,
                buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Reportar en el Canal', url: CHANNEL_LINK, merchant_url: CHANNEL_LINK }) }],
                headerType: 1
            }, { quoted: message });
        }

        const rawItems = (downloadData.data || []).filter(m => m && m.url);
        const seenUrls = new Set();
        const items = rawItems.filter(m => {
            if (seenUrls.has(m.url)) return false;
            seenUrls.add(m.url);
            return true;
        });

        if (items.length === 0) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, { text: '❌ No se encontró contenido multimedia en este enlace.' }, { quoted: message });
        }

        const maxItems = Math.min(items.length, 10);
        const seenHashes = new Set();
        let successCount = 0;

        for (let i = 0; i < maxItems; i++) {
            try {
                const media = items[i];
                const isVideo = (media?.type === 'video') || /\.(mp4|mov|avi|mkv|webm)$/i.test(media.url);
                const buffer = await fetchBufferFromUrl(media.url);

                const hash = crypto.createHash('sha1').update(buffer).digest('hex');
                if (seenHashes.has(hash)) continue;
                seenHashes.add(hash);

                let stickerBuffer = crop
                    ? await stickercropFromBuffer(buffer, isVideo)
                    : await convertBufferToStickerWebp(buffer, isVideo, false);

                if (stickerBuffer && stickerBuffer.length <= 950 * 1024) {
                    await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: message });
                    successCount++;
                }

                if (i < maxItems - 1) await new Promise(r => setTimeout(r, 800)); // Anti rate-limit
            } catch (err) {
                console.warn(`⚠️ Error procesando item ${i + 1}:`, err.message);
            }
        }

        if (successCount > 0) {
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } else {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            await sock.sendMessage(chatId, { text: '❌ No se pudo generar ningún sticker. Intenta con otro enlace.' }, { quoted: message });
        }

    } catch (err) {
        console.error('❌ Error en igsCommand:', err);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error inesperado al procesar el enlace de Instagram.' }, { quoted: message });
    }
}

module.exports = { igsCommand };