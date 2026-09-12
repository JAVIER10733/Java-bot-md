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
const { spawn } = require('child_process');

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
 * Procesa un buffer de medios utilizando FFmpeg de forma robusta.
 * @param {Buffer} buffer - El buffer de entrada.
 * @param {Array} args - Argumentos de FFmpeg.
 * @param {String} ext - Extensión del archivo de entrada.
 * @param {String} ext2 - Extensión del archivo de salida.
 * @returns {Promise<Buffer>} - El buffer procesado.
 */
async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
    await ensureTempDir();
    
    // Generar nombres de archivo únicos para evitar colisiones en uso concurrente
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tmp = path.join(TEMP_DIR, `media_in_${uniqueId}.${ext}`);
    const out = path.join(TEMP_DIR, `media_out_${uniqueId}.${ext2}`);

    try {
        // 1. Escribir buffer en disco
        await fs.writeFile(tmp, buffer);

        // 2. Ejecutar FFmpeg
        await new Promise((resolve, reject) => {
            const process = spawn('ffmpeg', [
                '-y', // Sobrescribir sin preguntar
                '-i', tmp,
                ...args,
                out
            ]);

            let errorOutput = '';
            // Capturar stderr para obtener detalles del error si falla
            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('error', (err) => {
                reject(new Error(`FFmpeg no se pudo ejecutar: ${err.message}. ¿Está instalado en el sistema?`));
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`FFmpeg falló con código ${code}. Detalles: ${errorOutput}`));
                } else {
                    resolve();
                }
            });
        });

        // 3. Leer el resultado
        const resultBuffer = await fs.readFile(out);
        return resultBuffer;
        
    } catch (error) {
        throw error;
    } finally {
        // 4. Limpieza GARANTIZADA de archivos temporales (evita fugas de memoria en el servidor)
        try { await fs.unlink(tmp); } catch {}
        try { await fs.unlink(out); } catch {}
    }
}

/**
 * Convierte audio a un formato reproducible en WhatsApp (MP3).
 * @param {Buffer} buffer - Buffer de audio.
 * @param {String} ext - Extensión original.
 */
function toAudio(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',          // Sin video
        '-ac', '2',     // Audio estéreo
        '-b:a', '128k', // Bitrate de audio
        '-ar', '44100', // Frecuencia de muestreo
        '-f', 'mp3'     // Formato de salida
    ], ext, 'mp3');
}

/**
 * Convierte audio a un formato de nota de voz de WhatsApp (PTT/Opus).
 * @param {Buffer} buffer - Buffer de audio.
 * @param {String} ext - Extensión original.
 */
function toPTT(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',                   // Sin video
        '-c:a', 'libopus',       // Codec Opus (requerido para PTT)
        '-b:a', '128k',          // Bitrate
        '-vbr', 'on',            // Variable Bit Rate
        '-compression_level', '10' // Máxima compresión
    ], ext, 'opus');
}

/**
 * Convierte video a un formato reproducible en WhatsApp (MP4/H.264).
 * @param {Buffer} buffer - Buffer de video.
 * @param {String} ext - Extensión original.
 */
function toVideo(buffer, ext) {
    return ffmpeg(buffer, [
        '-c:v', 'libx264', // Codec de video H.264 (compatible con WhatsApp)
        '-c:a', 'aac',     // Codec de audio AAC
        '-ab', '128k',     // Bitrate de audio
        '-ar', '44100',    // Frecuencia de muestreo
        '-crf', '32',      // Calidad de video (menor = mejor calidad, 32 es un buen equilibrio)
        '-preset', 'slow'  // Compresión más eficiente
    ], ext, 'mp4');
}

module.exports = {
    toAudio,
    toPTT,
    toVideo,
    ffmpeg
};