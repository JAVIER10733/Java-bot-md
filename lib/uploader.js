/**
 * Java Bot MD - Utilidades de Carga de Archivos
 * Gestiona la subida de medios a servicios externos (Telegra.ph, Uguu, Ezgif, FloNime).
 * Copyright (c) 2026 Professor
 */
const axios = require('axios');
const FormData = require('form-data');
const { fileTypeFromBuffer } = require('file-type');
const fetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');

/**
 * Sube una imagen a Telegra.ph
 * @param {string} Path - Ruta local del archivo a subir.
 * @returns {Promise<string>} URL de la imagen subida.
 */
async function TelegraPh(Path) {
    if (!fs.existsSync(Path)) {
        throw new Error('El archivo no existe en la ruta especificada.');
    }

    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(Path));

        const { data } = await axios.post('https://telegra.ph/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (data && data[0] && data[0].src) {
            return `https://telegra.ph${data[0].src}`;
        }
        throw new Error('Respuesta inválida de Telegra.ph');
    } catch (err) {
        console.error('❌ Error en TelegraPh:', err.message);
        throw new Error(`Fallo al subir a Telegra.ph: ${err.message}`);
    }
}

/**
 * Sube un archivo a Uguu.se
 * @param {string} input - Ruta local del archivo a subir.
 * @returns {Promise<string|object>} URL o datos de respuesta del archivo subido.
 */
async function UploadFileUgu(input) {
    if (!fs.existsSync(input)) {
        throw new Error('El archivo no existe en la ruta especificada.');
    }

    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(input));

        // Endpoint actualizado y más estable de Uguu
        const { data } = await axios.post('https://uguu.se/api.php?d=upload-tool', form, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                ...form.getHeaders()
            }
        });

        // Manejo flexible de la respuesta de Uguu (puede variar)
        if (data.files && data.files[0]) {
            return data.files[0].url || data.files[0];
        }
        if (data.url) {
            return data.url;
        }
        
        return data; // Fallback por si la estructura cambia
    } catch (err) {
        console.error('❌ Error en UploadFileUgu:', err.message);
        throw new Error(`Fallo al subir a Uguu: ${err.message}`);
    }
}

/**
 * Convierte un archivo WebP a MP4 usando el servicio web de Ezgif.
 * NOTA: Para mayor velocidad y fiabilidad, se recomienda usar la conversión local con FFmpeg.
 * @param {string} path - Ruta local del archivo WebP.
 * @returns {Promise<object>} Objeto con estado, mensaje y URL del resultado.
 */
async function webp2mp4File(path) {
    if (!fs.existsSync(path)) {
        throw new Error('El archivo WebP no existe en la ruta especificada.');
    }

    try {
        // Paso 1: Subir el archivo a Ezgif
        const form1 = new FormData();
        form1.append('new-image-url', '');
        form1.append('new-image', fs.createReadStream(path));

        const { data: step1 } = await axios.post('https://ezgif.com/webp-to-mp4', form1, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Content-Type': `multipart/form-data; boundary=${form1._boundary}`
            }
        });

        const $1 = cheerio.load(step1);
        const fileToken = $1('input[name="file"]').attr('value');
        
        if (!fileToken) {
            throw new Error('No se pudo obtener el identificador del archivo en Ezgif.');
        }

        // Paso 2: Solicitar la conversión
        const form2 = new FormData();
        form2.append('file', fileToken);
        form2.append('convert', "Convert WebP to MP4!");

        const { data: step2 } = await axios.post(`https://ezgif.com/webp-to-mp4/${fileToken}`, form2, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Content-Type': `multipart/form-data; boundary=${form2._boundary}`
            }
        });

        const $2 = cheerio.load(step2);
        const resultUrl = 'https:' + $2('div#output > p.outfile > video > source').attr('src');

        if (!resultUrl || resultUrl === 'https:') {
            throw new Error('El servicio de Ezgif no devolvió un video válido.');
        }

        return {
            status: true,
            message: "Conversión completada exitosamente",
            result: resultUrl
        };

    } catch (err) {
        console.error('❌ Error en webp2mp4File:', err.message);
        throw new Error(`Fallo en la conversión de Ezgif: ${err.message}`);
    }
}

/**
 * Sube un buffer de medios a FloNime.
 * @param {Buffer} medianya - Buffer del archivo a subir.
 * @param {object} options - Opciones adicionales (ej. { ext: 'mp4' }).
 * @returns {Promise<object>} Respuesta JSON del servicio.
 */
async function floNime(medianya, options = {}) {
    try {
        const fileType = await fileTypeFromBuffer(medianya);
        const ext = (fileType && fileType.ext) || options.ext || 'bin';
        
        const form = new FormData();
        form.append('file', medianya, `tmp.${ext}`);

        const response = await fetch('https://flonime.my.id/upload', {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: form
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const jsonnya = await response.json();
        return jsonnya;
    } catch (err) {
        console.error('❌ Error en floNime:', err.message);
        throw new Error(`Fallo al subir a FloNime: ${err.message}`);
    }
}

module.exports = { 
    TelegraPh, 
    UploadFileUgu, 
    webp2mp4File, 
    floNime 
};