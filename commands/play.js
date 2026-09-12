const yts = require('yt-search');
const axios = require('axios');

/**
 * Java Bot MD - Comando de Descarga de Música (.play / .song / .ytmp3)
 * Busca y descarga audio de YouTube en alta calidad con vista previa elegante.
 */
async function playCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Extraer y validar la búsqueda
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const searchQuery = text.replace(/^\.?(play|song|ytmp3|mp3|music)\s*/i, '').trim();
        
        if (!searchQuery || searchQuery.length < 2) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎵 *REPRODUCTOR DE MÚSICA* ⊱━━━╮
│
│  Busca y descarga tus canciones 
│  favoritas de YouTube en alta calidad.
│
│  💡 *Uso:* .play <nombre de la canción>
│  💡 *Ejemplo:* .play Bad Bunny Tití Me Preguntó
│  💡 *Ejemplo:* .play Bohemian Rhapsody Queen
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Música sin límites`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }],
                headerType: 1
            }, { quoted: message });
        }

        // 2. Reacción de búsqueda
        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        // 3. Buscar la canción en YouTube con timeout
        let videos = [];
        try {
            const searchResults = await yts({ query: searchQuery, limit: 5 });
            videos = searchResults.videos || [];
        } catch (searchError) {
            throw new Error('No se pudo conectar con el buscador de YouTube.');
        }

        if (!videos || videos.length === 0) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🔍 *SIN RESULTADOS* ⊱━━━╮
│
│  No se encontraron canciones para:
│  _"${searchQuery}"_
│
│  💡 *Consejo:* Verifica la ortografía
│  o intenta con el nombre del artista.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Música sin límites`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }],
                headerType: 1
            }, { quoted: message });
        }

        // 4. Seleccionar el mejor resultado
        const video = videos[0];
        const urlYt = video.url;
        const title = video.title || 'Título desconocido';
        const duration = video.timestamp || '0:00';
        const thumbnail = video.thumbnail || video.image;
        const author = video.author?.name || 'Artista desconocido';

        // 5. Enviar tarjeta de vista previa mientras se procesa el audio
        const previewMessage = `╭━━━⊱ 🎵 *REPRODUCIENDO AHORA* ⊱━━━╮
│
│  🎧 *Título:* ${title}
│  🎤 *Artista:* ${author}
│  ⏱️ *Duración:* ${duration}
│
│  ⏳ Procesando audio de alta calidad...
│  Esto puede tardar unos segundos.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            image: { url: thumbnail },
            caption: previewMessage,
            footer: `🤖 ${botName} | Música sin límites`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });

        // 6. Reacción de descarga
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // 7. Obtener el enlace de descarga del audio con timeout
        const apiUrl = `https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(urlYt)}`;
        
        let audioUrl = null;
        try {
            const response = await axios.get(apiUrl, { 
                timeout: 30000, // 30 segundos para la conversión
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            const data = response.data;
            if (data?.status && data?.result?.downloadUrl) {
                audioUrl = data.result.downloadUrl;
            } else {
                throw new Error('La API no devolvió un enlace válido');
            }
        } catch (apiError) {
            throw new Error('El servidor de conversión de audio no respondió. Intenta con otra canción.');
        }

        // 8. Enviar el archivo de audio
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title.replace(/[^\w\s.-]/g, '')}.mp3`,
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: `Por ${author} • ${duration}`,
                    thumbnail: { url: thumbnail },
                    mediaType: 1,
                    mediaUrl: urlYt,
                    sourceUrl: urlYt
                }
            }
        }, { quoted: message });

        // 9. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en playCommand:', error.message);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE DESCARGA* ⊱━━━╮
│
│  ${error.message || 'No se pudo descargar la canción.'}
│
│  💡 *Posibles causas:*
│  • El video es demasiado largo (>15 min).
│  • El video tiene restricción de edad.
│  • El servidor de conversión está saturado.
│
│  Intenta con otra canción más corta.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Soporte técnico`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Reportar en el Canal',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = playCommand;