/**
 * Java Bot MD - Subida de Imágenes
 * Sube imágenes a servicios externos con fallback automático en cascada.
 * Optimizado para máximo rendimiento sin escritura en disco.
 * Copyright (c) 2026 Professor
 */
const fetch = require('node-fetch');
const FormData = require('form-data');
const { fileTypeFromBuffer } = require('file-type');

const BOT_NAME = global.botname || 'Java Bot MD';

/**
 * Sube una imagen a qu.ax (servicio principal).
 * @param {Buffer} buffer - Buffer de la imagen.
 * @param {string} filename - Nombre del archivo (opcional).
 * @returns {Promise<string>} URL de la imagen subida.
 */
async function uploadToQuax(buffer, filename = 'upload') {
    const form = new FormData();
    form.append('files[]', buffer, {
        filename: `${filename}.jpg`,
        contentType: 'image/jpeg'
    });

    const response = await fetch('https://qu.ax/upload.php', {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...form.getHeaders()
        },
        body: form
    });

    if (!response.ok) {
        throw new Error(`qu.ax respondió con estado ${response.status}`);
    }

    const result = await response.json();
    
    // qu.ax puede devolver diferentes estructuras según la versión
    if (result?.files?.[0]?.url) {
        return result.files[0].url;
    }
    if (result?.success && result?.files?.[0]) {
        return typeof result.files[0] === 'string' ? result.files[0] : result.files[0].url;
    }
    if (result?.url) {
        return result.url;
    }
    
    throw new Error('Respuesta inválida de qu.ax');
}

/**
 * Sube una imagen a Telegra.ph (servicio de respaldo 1).
 * @param {Buffer} buffer - Buffer de la imagen.
 * @returns {Promise<string>} URL de la imagen subida.
 */
async function uploadToTelegraph(buffer) {
    const form = new FormData();
    form.append('file', buffer, {
        filename: 'upload.jpg',
        contentType: 'image/jpeg'
    });

    const response = await fetch('https://telegra.ph/upload', {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...form.getHeaders()
        },
        body: form
    });

    if (!response.ok) {
        throw new Error(`Telegra.ph respondió con estado ${response.status}`);
    }

    const img = await response.json();
    
    if (Array.isArray(img) && img[0]?.src) {
        return `https://telegra.ph${img[0].src}`;
    }
    if (img?.error) {
        throw new Error(`Telegra.ph error: ${img.error}`);
    }
    
    throw new Error('Respuesta inválida de Telegra.ph');
}

/**
 * Sube una imagen a Catbox.moe (servicio de respaldo 2 - muy estable).
 * @param {Buffer} buffer - Buffer de la imagen.
 * @returns {Promise<string>} URL de la imagen subida.
 */
async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, {
        filename: 'upload.jpg',
        contentType: 'image/jpeg'
    });

    const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...form.getHeaders()
        },
        body: form
    });

    if (!response.ok) {
        throw new Error(`Catbox respondió con estado ${response.status}`);
    }

    const url = await response.text();
    
    if (url && url.startsWith('http')) {
        return url.trim();
    }
    
    throw new Error(`Catbox devolvió una respuesta inválida: ${url}`);
}

/**
 * Función principal de subida con fallback en cascada.
 * Intenta qu.ax → Telegra.ph → Catbox.moe automáticamente.
 * 
 * @param {Buffer} buffer - Buffer de la imagen a subir.
 * @param {string} [filename='upload'] - Nombre base del archivo.
 * @returns {Promise<string>} URL final de la imagen subida.
 * @throws {Error} Si todos los servicios fallan.
 */
async function uploadImage(buffer, filename = 'upload') {
    // 1. Validar que sea un buffer válido
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error('El buffer de imagen es inválido o está vacío.');
    }

    // 2. Detectar el tipo de archivo para ajustar el contentType
    let contentType = 'image/jpeg';
    try {
        const fileType = await fileTypeFromBuffer(buffer);
        if (fileType) {
            if (fileType.mime.startsWith('image/')) {
                contentType = fileType.mime;
            } else if (fileType.mime.startsWith('video/')) {
                contentType = fileType.mime;
            }
        }
    } catch (_) {
        // Si falla la detección, usamos jpeg por defecto
    }

    const services = [
        { name: 'qu.ax', fn: () => uploadToQuax(buffer, filename) },
        { name: 'Telegra.ph', fn: () => uploadToTelegraph(buffer) },
        { name: 'Catbox.moe', fn: () => uploadToCatbox(buffer) }
    ];

    let lastError = null;

    // 3. Intentar cada servicio en orden hasta que uno funcione
    for (const service of services) {
        try {
            console.log(`📤 Intentando subir a ${service.name}...`);
            const url = await service.fn();
            console.log(`✅ Imagen subida exitosamente a ${service.name}`);
            return url;
        } catch (err) {
            console.warn(`️ ${service.name} falló: ${err.message}`);
            lastError = err;
            // Continuar con el siguiente servicio
        }
    }

    // 4. Si todos fallaron, lanzar error con el último mensaje
    throw new Error(`No se pudo subir la imagen a ningún servicio. Último error: ${lastError?.message || 'desconocido'}`);
}

module.exports = { 
    uploadImage,
    uploadToQuax,
    uploadToTelegraph,
    uploadToCatbox
};