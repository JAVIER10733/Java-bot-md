const axios = require('axios');
const yts = require('yt-search');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

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

async function getIzumiDownloadByUrl(youtubeUrl) {
    const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('El servidor principal no devolvió el audio.');
}

async function getIzumiDownloadByQuery(query) {
    const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube-play?query=${encodeURIComponent(query)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('La búsqueda del servidor principal falló.');
}

async function getOkatsuDownloadByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.dl) {
        return {
            download: res.data.dl,
            title: res.data.title,
            thumbnail: res.data.thumb
        };
    }
    throw new Error('El servidor de respaldo no devolvió el audio.');
}

/**
 * Java Bot MD - Comando de Descarga de Música (.song / .play / .mp3)
 * Descarga audio de YouTube en alta calidad con vista previa y metadatos enriquecidos.
 */
async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const searchQuery = text.replace(/^\.?(song|play|musica|mp3)\s*/i, '').trim();

        // 1. Validar que se haya proporcionado una búsqueda o enlace
        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎵 *DESCARGA DE MÚSICA* ⊱━━━╮
│
│  Descarga tus canciones favoritas 
│  de YouTube en alta calidad de audio.
│
│  💡 *Uso:* .song <nombre o enlace>
│  💡 *Ejemplo:* .song Bad Bunny Monaco
│  💡 *Ejemplo:* .song https://youtu.be/...
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Música sin límites`,
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
        let videoDuration = '';

        // 3. Determinar si es un enlace directo o una búsqueda
        if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
            videoUrl = searchQuery;
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            if (ytId) videoThumbnail = `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;
        } else {
            const search = await yts(searchQuery);
            if (!search || !search.videos.length) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ 🔍 *SIN RESULTADOS* ⊱━━━╮
│
│  No se encontraron canciones para:
│  _"${searchQuery}"_
│
│  💡 *Consejo:* Verifica la ortografía 
│  o intenta con otros términos.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${BOT_NAME} | Música sin límites`,
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
            videoUrl = search.videos[0].url;
            videoTitle = search.videos[0].title;
            videoThumbnail = search.videos[0].thumbnail;
            videoDuration = search.videos[0].timestamp;
        }

        // 4. Enviar vista previa de procesamiento
        const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
        const thumb = videoThumbnail || `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;
        const captionTitle = videoTitle || searchQuery;

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        
        await sock.sendMessage(chatId, {
            image: { url: thumb },
            caption: `╭━━━⊱ 🎵 *PROCESANDO AUDIO* ⊱━━━╮
│
│  🎧 *Título:* ${captionTitle}
│  ⏱️ *Duración:* ${videoDuration || 'Calculando...'}
│  ⏳ *Estado:* Descargando y convirtiendo...
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Música sin límites`,
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

        // 5. Obtener audio: intentar API principal, luego búsqueda, luego respaldo
        let audioData;
        try {
            audioData = await getIzumiDownloadByUrl(videoUrl);
        } catch (e1) {
            try {
                const query = videoTitle || searchQuery;
                audioData = await getIzumiDownloadByQuery(query);
            } catch (e2) {
                audioData = await getOkatsuDownloadByUrl(videoUrl);
            }
        }

        const finalTitle = audioData.title || videoTitle || 'Canción de YouTube';
        const cleanFileName = `${finalTitle.replace(/[^\w\s.-]/g, '')}.mp3`;
        const finalThumb = audioData.thumbnail || thumb;

        // 6. Enviar el audio con metadatos enriquecidos (externalAdReply)
        await sock.sendMessage(chatId, {
            audio: { url: audioData.download || audioData.dl || audioData.url },
            mimetype: 'audio/mpeg',
            fileName: cleanFileName,
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: finalTitle,
                    body: `Descargado por ${BOT_NAME}`,
                    thumbnailUrl: finalThumb,
                    mediaType: 1, // Tipo Audio/Música
                    renderLargerThumbnail: true,
                    sourceUrl: videoUrl
                }
            }
        }, { quoted: message });

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('❌ Error en songCommand:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE DESCARGA* ⊱━━━╮
│
│  No se pudo descargar la canción.
│
│  💡 *Posibles causas:*
│  • El video es demasiado largo (>15 min).
│  • El video tiene restricción de edad.
│  • Los servidores de descarga están 
│    temporalmente saturados.
│
│  Intenta con otra canción más corta.
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

module.exports = songCommand;