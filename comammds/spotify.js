const axios = require('axios');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando de Búsqueda y Descarga de Spotify (.spotify)
 * Busca y reproduce canciones de Spotify con una experiencia de reproductor nativo.
 */
async function spotifyCommand(sock, chatId, message) {
    try {
        // 1. Extraer y limpiar la consulta
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() || '';

        const used = (rawText || '').split(/\s+/)[0] || '.spotify';
        const query = rawText.slice(used.length).trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎵 *BUSCADOR DE SPOTIFY* ⊱━━━╮
│
│  Busca y descarga tus canciones 
│  favoritas de Spotify en alta calidad.
│
│  💡 *Uso:* .spotify <canción o artista>
│  💡 *Ejemplo:* .spotify Con Calma
│  💡 *Ejemplo:* .spotify Bad Bunny Monaco
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

        // 3. Consulta a la API con timeout de seguridad
        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/search/spotify?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl, { 
            timeout: 20000, 
            headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
        });

        if (!data?.status || !data?.result) {
            throw new Error('No se encontraron resultados en Spotify.');
        }

        const r = data.result;
        const audioUrl = r.audio;
        
        if (!audioUrl) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, { 
                text: '❌ No se encontró un enlace de audio descargable para esta canción. Intenta con otra búsqueda.' 
            }, { quoted: message });
        }

        // 4. Preparar metadatos para una experiencia de reproductor premium
        const title = r.title || r.name || 'Canción Desconocida';
        const artist = r.artist || 'Artista Desconocido';
        const duration = r.duration || '0:00';
        const thumbnail = r.thumbnails || 'https://i.imgur.com/2wzGhpF.jpeg'; // Fallback elegante
        const sourceUrl = r.url || 'https://open.spotify.com';
        
        // Limpiar nombre de archivo (máx 50 caracteres, sin caracteres especiales)
        const cleanFileName = `${title} - ${artist}`.replace(/[^\w\s.-]/g, '').substring(0, 50) + '.mp3';

        // 5. Reacción de descarga
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // 6. Enviar el audio con metadatos enriquecidos (External Ad Reply)
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: cleanFileName,
            ptt: false, // false para que se muestre como pista de música, no como nota de voz
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: `${artist} • ${duration}`,
                    thumbnailUrl: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    sourceUrl: sourceUrl
                }
            }
        }, { quoted: message });

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en spotifyCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE BÚSQUEDA* ⊱━━━╮
│
│  No se pudo obtener el audio de Spotify 
│  en este momento.
│
│  💡 *Posibles causas:*
│  • La canción no está disponible.
│  • El servidor de búsqueda está saturado.
│  • La consulta es demasiado ambigua.
│
│  Intenta con otro nombre o artista.
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

module.exports = spotifyCommand;