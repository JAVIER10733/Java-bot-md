const axios = require('axios');
const yts = require('yt-search');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

const IZUMI_BASE_URL = "https://izumiiiiiiii.dpdns.org";
const OKATSU_BASE_URL = "https://okatsu-rolezapiiz.vercel.app";

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

/**
 * Intenta una petición con reintentos automáticos para mayor fiabilidad.
 */
async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

async function getIzumiVideoByUrl(youtubeUrl) {
    const apiUrl = `${IZUMI_BASE_URL}/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=720`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('El servidor principal no devolvió el video.');
}

async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `${OKATSU_BASE_URL}/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.mp4) {
        return { download: res.data.result.mp4, title: res.data.result.title };
    }
    throw new Error('El servidor de respaldo no devolvió el video.');
}

/**
 * Java Bot MD - Comando de Descarga de Videos (.video / .ytmp4)
 * Descarga videos de YouTube en alta calidad con vista previa y metadatos enriquecidos.
 */
async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const searchQuery = text.replace(/^\.?(video|ytmp4|mp4|ytvideo)\s*/i, '').trim();

        // 1. Validar que se haya proporcionado una búsqueda o enlace
        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 📥 *DESCARGA DE VIDEOS* ⊱━━━╮
│
│  Descarga videos de YouTube en 
│  alta calidad (720p) de forma 
│  rápida y sin marcas de agua.
│
│  💡 *Uso:* .video <nombre o enlace>
│  💡 *Ejemplo:* .video Bad Bunny Monaco
│  💡 *Ejemplo:* .video https://youtu.be/...
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Descargas rápidas`,
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

        // 2. Reacción de búsqueda
        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';

        // 3. Determinar si es un enlace directo o una búsqueda
        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            if (ytId) videoThumbnail = `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;
        } else {
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ 🔍 *SIN RESULTADOS* ⊱━━━╮
│
│  No se encontraron videos para:
│  _"${searchQuery}"_
│
│  💡 *Consejo:* Verifica la ortografía 
│  o intenta con otros términos.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${BOT_NAME} | Descargas rápidas`,
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
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        // 4. Validar que sea una URL de YouTube válida
        const urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, { text: '❌ Ese no es un enlace válido de YouTube.' }, { quoted: message });
        }

        // 5. Enviar vista previa de procesamiento
        const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
        const thumb = videoThumbnail || `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;
        const captionTitle = videoTitle || searchQuery;
        
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        
        await sock.sendMessage(chatId, {
            image: { url: thumb },
            caption: `╭━━━⊱ 📥 *PROCESANDO VIDEO* ⊱━━━╮
│
│  🎬 *Título:* ${captionTitle}
│  ⏳ *Estado:* Descargando en 720p...
│  ⏱️ *Tiempo estimado:* Unos segundos.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Descargas rápidas`,
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

        // 6. Obtener video: intentar API principal, luego respaldo
        let videoData;
        try {
            videoData = await getIzumiVideoByUrl(videoUrl);
        } catch (e1) {
            try {
                videoData = await getOkatsuVideoByUrl(videoUrl);
            } catch (e2) {
                throw new Error('Ambos servidores de descarga fallaron. El video puede ser muy largo o estar restringido.');
            }
        }

        const finalTitle = videoData.title || videoTitle || 'Video de YouTube';
        const cleanFileName = `${finalTitle.replace(/[^\w\s.-]/g, '')}.mp4`;

        // 7. Enviar el video con metadatos enriquecidos (externalAdReply)
        await sock.sendMessage(chatId, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: cleanFileName,
            caption: `╭━━━⊱ ✅ *VIDEO DESCARGADO* ⊱━━━╮
│
│  🎬 *Título:* ${finalTitle}
│  📐 *Calidad:* 720p HD
│
│  📥 ¡Tu video está listo para 
│  ser reproducido y compartido!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            contextInfo: {
                externalAdReply: {
                    title: finalTitle,
                    body: `Descargado por ${BOT_NAME}`,
                    thumbnailUrl: thumb,
                    mediaType: 2, // Tipo Video
                    renderLargerThumbnail: true,
                    sourceUrl: videoUrl
                }
            }
        }, { quoted: message });

        // 8. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en videoCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE DESCARGA* ⊱━━━╮
│
│  ${error.message || 'No se pudo descargar el video.'}
│
│  💡 *Posibles causas:*
│  • El video es demasiado largo (>15 min).
│  • El video tiene restricción de edad.
│  • Los servidores de descarga están 
│    temporalmente saturados.
│
│  Intenta con otro video más corto.
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
    }
}

module.exports = videoCommand;