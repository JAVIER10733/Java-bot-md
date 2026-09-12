/**
 * Java Bot MD - WhatsApp Bot
 * Copyright (c) 2026 Professor
 * 
 * Este programa es software libre: puedes redistribuirlo y/o modificarlo
 * bajo los términos de la Licencia MIT.
 * 
 * Créditos:
 * - Librería Baileys por @adiwajshing
 * - Implementación de medios inspirada en la comunidad de desarrolladores de bots.
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const webp = require('node-webpmux');

// Directorio temporal unificado (el mismo que usa el resto del bot)
const TEMP_DIR = path.join(__dirname, '..', 'temp');

/**
 * Asegura que el directorio temporal exista de forma segura.
 */
async function ensureTempDir() {
    try {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    } catch (err) {
        console.error('❌ Error al crear directorio temporal:', err.message);
    }
}

/**
 * Genera un nombre de archivo único para evitar colisiones.
 */
function getUniqueFileName(ext) {
    return `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
}

/**
 * Convierte una imagen a WebP usando FFmpeg.
 * @param {Buffer} mediaBuffer - Buffer de la imagen original.
 * @returns {Promise<Buffer>} - Buffer de la imagen en formato WebP.
 */
async function imageToWebp(mediaBuffer) {
    await ensureTempDir();
    const tmpIn = path.join(TEMP_DIR, getUniqueFileName('jpg'));
    const tmpOut = path.join(TEMP_DIR, getUniqueFileName('webp'));

    try {
        await fs.writeFile(tmpIn, mediaBuffer);

        await new Promise((resolve, reject) => {
            const process = spawn('ffmpeg', [
                '-y',
                '-i', tmpIn,
                '-vcodec', 'libwebp',
                '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                tmpOut
            ]);

            process.on('error', reject);
            process.on('close', (code) => {
                if (code !== 0) reject(new Error(`FFmpeg falló con código ${code}`));
                else resolve();
            });
        });

        return await fs.readFile(tmpOut);
    } finally {
        // Limpieza GARANTIZADA de archivos temporales
        try { await fs.unlink(tmpIn); } catch {}
        try { await fs.unlink(tmpOut); } catch {}
    }
}

/**
 * Convierte un video a WebP animado usando FFmpeg.
 * @param {Buffer} mediaBuffer - Buffer del video original.
 * @returns {Promise<Buffer>} - Buffer del video en formato WebP animado.
 */
async function videoToWebp(mediaBuffer) {
    await ensureTempDir();
    const tmpIn = path.join(TEMP_DIR, getUniqueFileName('mp4'));
    const tmpOut = path.join(TEMP_DIR, getUniqueFileName('webp'));

    try {
        await fs.writeFile(tmpIn, mediaBuffer);

        await new Promise((resolve, reject) => {
            const process = spawn('ffmpeg', [
                '-y',
                '-i', tmpIn,
                '-vcodec', 'libwebp',
                '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
                '-loop', '0',
                '-ss', '00:00:00',
                '-t', '00:00:05', // Máximo 5 segundos para stickers animados (límite de WhatsApp)
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                tmpOut
            ]);

            process.on('error', reject);
            process.on('close', (code) => {
                if (code !== 0) reject(new Error(`FFmpeg falló con código ${code}`));
                else resolve();
            });
        });

        return await fs.readFile(tmpOut);
    } finally {
        // Limpieza GARANTIZADA de archivos temporales
        try { await fs.unlink(tmpIn); } catch {}
        try { await fs.unlink(tmpOut); } catch {}
    }
}

/**
 * Escribe metadatos EXIF en un sticker WebP.
 * @param {Buffer|Object} media - Buffer del WebP o objeto { mimetype, data }.
 * @param {Object} metadata - Metadatos { packname, author, categories }.
 * @returns {Promise<Buffer>} - El buffer final con los metadatos EXIF inyectados.
 */
async function writeExif(media, metadata) {
    await ensureTempDir();
    const tmpIn = path.join(TEMP_DIR, getUniqueFileName('webp'));
    const tmpOut = path.join(TEMP_DIR, getUniqueFileName('webp'));

    try {
        // 1. Normalizar la entrada (soporta tanto Buffer directo como objeto { mimetype, data })
        let rawBuffer = media;
        let isImage = false;
        let isVideo = false;

        if (typeof media === 'object' && media !== null && 'mimetype' in media && 'data' in media) {
            rawBuffer = media.data;
            isImage = /image/.test(media.mimetype) && !/webp/.test(media.mimetype);
            isVideo = /video/.test(media.mimetype) && !/webp/.test(media.mimetype);
        }

        // 2. Convertir a WebP si es una imagen o video crudo
        let webpBuffer = rawBuffer;
        if (isImage) {
            webpBuffer = await imageToWebp(rawBuffer);
        } else if (isVideo) {
            webpBuffer = await videoToWebp(rawBuffer);
        }

        await fs.writeFile(tmpIn, webpBuffer);

        // 3. Inyectar metadatos EXIF
        if (metadata && (metadata.packname || metadata.author)) {
            const img = new webp.Image();
            await img.load(tmpIn);

            const packname = metadata.packname || global.botname || 'Java Bot MD';
            const author = metadata.author || global.author || 'Professor';
            const emojis = (metadata.categories && metadata.categories.length > 0) ? metadata.categories : ['🤖'];

            const json = {
                'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                'sticker-pack-name': packname,
                'sticker-pack-publisher': author,
                'emojis': emojis
            };

            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
            const exif = Buffer.concat([exifAttr, jsonBuff]);
            exif.writeUIntLE(jsonBuff.length, 14, 4);

            img.exif = exif;
            await img.save(tmpOut);

            return await fs.readFile(tmpOut);
        }

        return webpBuffer;
    } finally {
        // Limpieza GARANTIZADA de archivos temporales
        try { await fs.unlink(tmpIn); } catch {}
        try { await fs.unlink(tmpOut); } catch {}
    }
}

/**
 * Funciones de compatibilidad para módulos legacy que las llamen por separado.
 */
async function writeExifImg(media, metadata) {
    const webpBuffer = await imageToWebp(media);
    return writeExif(webpBuffer, metadata);
}

async function writeExifVid(media, metadata) {
    const webpBuffer = await videoToWebp(media);
    return writeExif(webpBuffer, metadata);
}

module.exports = {
    imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid,
    writeExif
};