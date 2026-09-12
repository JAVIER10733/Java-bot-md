/**
 * Java Bot MD - Descargador de YouTube
 * Gestiona la búsqueda y descarga de audio/video de YouTube con metadatos completos.
 * Copyright (c) 2026 Professor
 */
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const axios = require('axios');

// Directorio temporal unificado para evitar fugas de espacio en disco
const TEMP_DIR = path.join(process.cwd(), 'temp');
const ytIdRegex = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/;

class YTDownloader {
    constructor() {
        this._ensureTempDir();
    }

    /**
     * Asegura que el directorio temporal exista.
     */
    _ensureTempDir() {
        if (!fsSync.existsSync(TEMP_DIR)) {
            fsSync.mkdirSync(TEMP_DIR, { recursive: true });
        }
    }

    /**
     * Verifica si una URL es de YouTube.
     * @param {string} url - URL a verificar.
     * @returns {boolean}
     */
    static isYTUrl(url) {
        return ytIdRegex.test(url);
    }

    /**
     * Extrae el ID del video de una URL de YouTube.
     * @param {string} url - URL de YouTube.
     * @returns {string} ID del video.
     */
    static getVideoID(url) {
        if (!this.isYTUrl(url)) throw new Error('No es una URL de YouTube válida');
        return ytIdRegex.exec(url)[1];
    }

    /**
     * Busca videos en YouTube.
     * @param {string} query - Término de búsqueda.
     * @returns {Promise<Array>} Lista de videos encontrados.
     */
    static async search(query) {
        const search = await yts(query);
        return search.videos.map(v => ({
            title: v.title,
            artist: v.author.name,
            id: v.videoId,
            url: v.url,
            duration: v.duration.timestamp,
            image: v.thumbnail
        }));
    }

    /**
     * Descarga audio de YouTube y opcionalmente inyecta metadatos ID3.
     * @param {string} url - URL o ID del video de YouTube.
     * @param {Object} customMetadata - Metadatos personalizados (opcional).
     * @param {boolean} autoWriteTags - Si es true, extrae metadatos automáticamente de YouTube.
     * @returns {Promise<Object>} Ruta del archivo, metadatos y tamaño.
     */
    async downloadAudio(url, customMetadata = {}, autoWriteTags = false) {
        this._ensureTempDir();
        if (!url) throw new Error('Se requiere una URL o ID de YouTube');
        
        const videoId = YTDownloader.isYTUrl(url) ? YTDownloader.getVideoID(url) : url;
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
        const { videoDetails } = info;

        // Nombre de archivo único para evitar colisiones
        const fileName = `yt_audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
        const filePath = path.join(TEMP_DIR, fileName);

        return new Promise((resolve, reject) => {
            const stream = ytdl(videoId, { 
                filter: 'audioonly', 
                quality: 'highestaudio',
                highWaterMark: 1 << 25 // 32MB buffer para mayor velocidad
            });
            
            ffmpeg(stream)
                .audioFrequency(44100)
                .audioChannels(2)
                .audioBitrate(128)
                .audioCodec('libmp3lame')
                .toFormat('mp3')
                .save(filePath)
                .on('end', async () => {
                    try {
                        // Determinar qué metadatos usar
                        const finalMeta = autoWriteTags ? {
                            Title: videoDetails.title,
                            Artist: videoDetails.author.name,
                            Album: videoDetails.author.name,
                            Year: videoDetails.publishDate ? videoDetails.publishDate.split('-')[0] : '',
                            Image: videoDetails.thumbnails.slice(-1)[0].url
                        } : { ...customMetadata };

                        // Inyectar metadatos si hay información válida
                        if (Object.keys(finalMeta).length > 0 && finalMeta.Title) {
                            let imageBuffer = null;
                            
                            // Descargar miniatura de forma segura
                            if (finalMeta.Image) {
                                try {
                                    const imgRes = await axios.get(finalMeta.Image, { 
                                        responseType: 'arraybuffer',
                                        timeout: 10000
                                    });
                                    imageBuffer = imgRes.data;
                                } catch (e) {
                                    console.warn('⚠️ No se pudo descargar la miniatura para los metadatos');
                                }
                            }

                            const tags = {
                                title: finalMeta.Title,
                                artist: finalMeta.Artist || 'Desconocido',
                                album: finalMeta.Album || 'YouTube',
                                year: finalMeta.Year || ''
                            };

                            if (imageBuffer) {
                                tags.image = {
                                    mime: 'jpeg',
                                    type: { id: 3, name: 'front cover' },
                                    imageBuffer: imageBuffer,
                                    description: `Cover of ${finalMeta.Title}`
                                };
                            }

                            // node-id3.write es síncrono y seguro
                            NodeID3.write(tags, filePath);
                        }

                        const stats = await fs.stat(filePath);
                        resolve({
                            meta: {
                                title: videoDetails.title,
                                channel: videoDetails.author.name,
                                seconds: videoDetails.lengthSeconds,
                                image: videoDetails.thumbnails.slice(-1)[0].url
                            },
                            path: filePath,
                            size: stats.size
                        });
                    } catch (err) {
                        reject(err);
                    }
                })
                .on('error', (err) => {
                    console.error('❌ Error en FFmpeg (downloadAudio):', err.message);
                    reject(err);
                });
        });
    }

    /**
     * Obtiene la información y URL de descarga directa de un video de YouTube.
     * @param {string} url - URL o ID del video.
     * @param {string} quality - Calidad del video (ej: '134' para 360p, '137' para 1080p).
     * @returns {Promise<Object>} Información del video y URL de descarga.
     */
    static async getVideoInfo(url, quality = '134') {
        if (!url) throw new Error('Se requiere una URL o ID de YouTube');
        const videoId = this.isYTUrl(url) ? this.getVideoID(url) : url;
        
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
        const format = ytdl.chooseFormat(info.formats, { quality, filter: 'videoandaudio' });
        
        if (!format) {
            throw new Error('No se encontró un formato de video con la calidad especificada');
        }

        return {
            title: info.videoDetails.title,
            thumb: info.videoDetails.thumbnails.slice(-1)[0].url,
            date: info.videoDetails.publishDate,
            duration: info.videoDetails.lengthSeconds,
            channel: info.videoDetails.ownerChannelName,
            quality: format.qualityLabel,
            contentLength: format.contentLength,
            description: info.videoDetails.description,
            videoUrl: format.url
        };
    }
}

// Exportar una instancia única para mantener el estado del directorio temporal
module.exports = new YTDownloader();