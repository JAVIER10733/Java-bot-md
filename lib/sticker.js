/**
 * Java Bot MD - Utilidad de Creación de Stickers
 * Convierte imágenes y videos a formato WebP con metadatos EXIF de WhatsApp.
 * Copyright (c) 2026 Professor
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const { fileTypeFromBuffer } = require('file-type');
const webp = require('node-webpmux');
const fetch = require('node-fetch');
const ffmpeg = require('fluent-ffmpeg');

const TEMP_DIR = path.join(__dirname, '..', 'temp');

/**
 * Asegura que el directorio temporal exista.
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
 * Obtiene un buffer desde una URL o devuelve el buffer directamente.
 */
async function getMediaBuffer(media) {
    if (Buffer.isBuffer(media)) return media;
    if (typeof media === 'string' && media.startsWith('http')) {
        const res = await fetch(media, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (!res.ok) throw new Error(`Error al descargar: ${res.status}`);
        return await res.buffer();
    }
    throw new Error('Tipo de medio no soportado. Debe ser un Buffer o una URL válida.');
}

/**
 * Convierte un buffer de imagen o video a WebP y añade metadatos EXIF.
 * @param {Buffer|string} media - Buffer de la imagen/video o URL.
 * @param {Object} options - Opciones: packname, author, emojis, isVideo (forzar video).
 * @returns {Promise<Buffer>} - Buffer del sticker final con EXIF.
 */
async function createSticker(media, options = {}) {
    await ensureTempDir();
    const { 
        packname = global.packname || 'Java Bot MD', 
        author = global.author || 'Professor', 
        emojis = ['🤖'],
        isVideo = false
    } = options;

    const buffer = await getMediaBuffer(media);
    const type = await fileTypeFromBuffer(buffer) || { mime: 'application/octet-stream', ext: 'bin' };
    
    if (type.ext === 'bin') {
        throw new Error('No se pudo determinar el tipo de archivo o el formato no es soportado.');
    }

    const forceVideo = isVideo || type.mime.startsWith('video/') || type.mime.includes('gif');
    const inputExt = type.ext === 'bin' ? 'jpg' : type.ext;
    
    const tmpIn = path.join(TEMP_DIR, getUniqueFileName(inputExt));
    const tmpOut = path.join(TEMP_DIR, getUniqueFileName('webp'));

    try {
        await fs.writeFile(tmpIn, buffer);

        await new Promise((resolve, reject) => {
            let command = ffmpeg(tmpIn);
            
            if (forceVideo) {
                command = command
                    .inputFormat(type.ext)
                    .videoFilters([
                        'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease',
                        'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                        'fps=15'
                    ])
                    .duration(10) // Máximo 10 segundos (límite de WhatsApp)
                    .outputOptions([
                        '-vcodec', 'libwebp',
                        '-preset', 'default',
                        '-loop', '0',
                        '-vsync', '0',
                        '-pix_fmt', 'yuva420p',
                        '-quality', '75',
                        '-compression_level', '6'
                    ]);
            } else {
                command = command
                    .videoFilters([
                        'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease',
                        'format=rgba',
                        'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000'
                    ])
                    .outputOptions([
                        '-vcodec', 'libwebp',
                        '-preset', 'default',
                        '-loop', '0',
                        '-vsync', '0',
                        '-pix_fmt', 'yuva420p',
                        '-quality', '75',
                        '-compression_level', '6'
                    ]);
            }

            command
                .toFormat('webp')
                .on('error', (err) => {
                    console.error('❌ Error de FFmpeg en createSticker:', err.message);
                    reject(err);
                })
                .on('end', () => resolve())
                .save(tmpOut);
        });

        // Leer el WebP generado y añadir metadatos EXIF
        const webpBuffer = await fs.readFile(tmpOut);
        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': packname,
            'sticker-pack-publisher': author,
            'emojis': emojis
        };

        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exif;
        const finalBuffer = await img.save(null);

        return finalBuffer;

    } finally {
        // Limpieza GARANTIZADA de archivos temporales
        try { await fs.unlink(tmpIn); } catch {}
        try { await fs.unlink(tmpOut); } catch {}
    }
}

/**
 * Añade metadatos EXIF a un buffer WebP existente (Compatibilidad con código legacy).
 * @param {Buffer} webpSticker - Buffer del sticker WebP.
 * @param {string} packname - Nombre del paquete.
 * @param {string} author - Autor del paquete.
 * @param {string[]} categories - Emojis asociados.
 * @returns {Promise<Buffer>} - Buffer con EXIF inyectado.
 */
async function addExif(webpSticker, packname, author, categories = [''], extra = {}) {
    const img = new webp.Image();
    await img.load(webpSticker);
    
    const json = { 
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'), 
        'sticker-pack-name': packname || global.packname || 'Java Bot MD', 
        'sticker-pack-publisher': author || global.author || 'Professor', 
        'emojis': categories, 
        ...extra 
    };
    
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    
    img.exif = exif;
    return await img.save(null);
}

/**
 * Alias para compatibilidad con código legacy que llame a `sticker()`.
 */
async function sticker(media, url, packname, author) {
    return createSticker(url || media, { packname, author });
}

module.exports = {
    createSticker,
    sticker, // Compatibilidad hacia atrás
    addExif,
    support: {
        ffmpeg: true,
        ffprobe: true,
        ffmpegWebp: true,
        convert: false,
        magick: false,
        gm: false,
        find: false
    }
};