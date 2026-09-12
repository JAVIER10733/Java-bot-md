/**
 * Java Bot MD - Utilidades de Carga y Conversión
 * Copyright (c) 2026 Professor
 * 
 * Este programa es software libre: puedes redistribuirlo y/o modificarlo
 * bajo los términos de la Licencia MIT.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Directorio temporal unificado
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
 * Genera un nombre de archivo único.
 */
function getUniqueFileName(ext) {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
}

/**
 * Pausa la ejecución por un tiempo determinado (en milisegundos).
 */
exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Obtiene datos JSON de una URL con manejo robusto de errores.
 */
exports.fetchJson = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'GET',
            url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                ...options.headers
            },
            ...options
        });
        return res.data;
    } catch (err) {
        console.error(`❌ Error en fetchJson (${url}):`, err.message);
        return null;
    }
};

/**
 * Obtiene un buffer de una URL con manejo robusto de errores.
 */
exports.fetchBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'GET',
            url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'DNT': 1,
                'Upgrade-Insecure-Requests': 1,
                ...options.headers
            },
            responseType: 'arraybuffer',
            ...options
        });
        return res.data;
    } catch (err) {
        console.error(`❌ Error en fetchBuffer (${url}):`, err.message);
        return null;
    }
};

/**
 * Convierte un archivo WebP a MP4 usando FFmpeg local (mucho más rápido y fiable que ezgif).
 * @param {string} inputPath - Ruta del archivo WebP de entrada.
 * @returns {Promise<string>} - URL o ruta del archivo MP4 resultante.
 */
exports.webp2mp4File = async (inputPath) => {
    await ensureTempDir();
    const outputPath = path.join(TEMP_DIR, getUniqueFileName('mp4'));

    return new Promise((resolve, reject) => {
        const process = spawn('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-movflags', 'faststart',
            '-pix_fmt', 'yuv420p',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            outputPath
        ]);

        let errorOutput = '';
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        process.on('close', async (code) => {
            if (code !== 0) {
                reject(new Error(`FFmpeg falló con código ${code}. Detalles: ${errorOutput}`));
            } else {
                try {
                    // Opcional: subir a un servidor o devolver la ruta local
                    // Aquí devolvemos la ruta local para que el bot la use directamente
                    resolve({
                        status: true,
                        message: "Conversión local exitosa",
                        result: outputPath
                    });
                } catch (err) {
                    reject(err);
                }
            }
        });

        process.on('error', (err) => {
            reject(new Error(`No se pudo ejecutar FFmpeg: ${err.message}. ¿Está instalado en el sistema?`));
        });
    });
};

/**
 * Sube una imagen a Telegra.ph y devuelve la URL.
 * @param {string} filePath - Ruta del archivo a subir.
 * @returns {Promise<string>} - URL de la imagen en Telegra.ph.
 */
exports.TelegraPh = async (filePath) => {
    try {
        if (!fsSync.existsSync(filePath)) {
            throw new Error("El archivo no existe en la ruta especificada.");
        }

        const form = new FormData();
        form.append('file', fsSync.createReadStream(filePath));

        const { data } = await axios.post('https://telegra.ph/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (data && data[0] && data[0].src) {
            return `https://telegra.ph${data[0].src}`;
        }
        throw new Error("Respuesta inválida de Telegra.ph");
    } catch (err) {
        console.error('❌ Error en TelegraPh:', err.message);
        throw new Error(`Fallo al subir a Telegra.ph: ${err.message}`);
    }
};

/**
 * Convierte un buffer de GIF a MP4 usando FFmpeg local.
 * @param {Buffer} imageBuffer - Buffer del archivo GIF.
 * @returns {Promise<Buffer>} - Buffer del archivo MP4 resultante.
 */
exports.buffergif = async (imageBuffer) => {
    await ensureTempDir();
    const inputPath = path.join(TEMP_DIR, getUniqueFileName('gif'));
    const outputPath = path.join(TEMP_DIR, getUniqueFileName('mp4'));

    try {
        // 1. Escribir el buffer en disco
        await fs.writeFile(inputPath, imageBuffer);

        // 2. Convertir con FFmpeg
        await new Promise((resolve, reject) => {
            const process = spawn('ffmpeg', [
                '-y',
                '-i', inputPath,
                '-movflags', 'faststart',
                '-pix_fmt', 'yuv420p',
                '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                '-c:v', 'libx264',
                '-c:a', 'aac',
                outputPath
            ]);

            process.on('error', reject);
            process.on('close', (code) => {
                if (code !== 0) reject(new Error(`FFmpeg falló con código ${code}`));
                else resolve();
            });
        });

        // 3. Leer el resultado como buffer
        const resultBuffer = await fs.readFile(outputPath);
        return resultBuffer;

    } catch (err) {
        console.error('❌ Error en buffergif:', err.message);
        throw err;
    } finally {
        // 4. Limpieza GARANTIZADA de archivos temporales
        try { await fs.unlink(inputPath); } catch {}
        try { await fs.unlink(outputPath); } catch {}
    }
};

/**
 * Obtiene la versión actual de WhatsApp Web.
 */
exports.WAVersion = async () => {
    try {
        const data = await this.fetchJson("https://web.whatsapp.com/check-update?version=1&platform=web");
        if (data && data.currentVersion) {
            return [data.currentVersion.replace(/[.]/g, ", ")];
        }
        return ["2.3000.0"]; // Fallback seguro
    } catch (err) {
        console.error('❌ Error al obtener WAVersion:', err.message);
        return ["2.3000.0"];
    }
};

/**
 * Genera un nombre de archivo aleatorio con extensión.
 */
exports.getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

/**
 * Verifica si una cadena es una URL válida.
 */
exports.isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, 'gi'));
};

/**
 * Verifica si un valor es un número válido.
 */
exports.isNumber = (number) => {
    const int = parseInt(number, 10);
    return typeof int === 'number' && !isNaN(int);
};

// Recarga automática del archivo en modo desarrollo (Hot Reload)
const file = require.resolve(__filename);
fsSync.watchFile(file, () => {
    fsSync.unwatchFile(file);
    console.log(`\x1b[91m🔄 Actualizado: ${path.basename(__filename)}\x1b[0m`);
    delete require.cache[file];
    require(file);
});