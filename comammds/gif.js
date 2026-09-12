const axios = require('axios');

/**
 * Java Bot MD - Comando de Búsqueda de GIFs (.gif)
 * Busca y envía GIFs animados de alta calidad desde Giphy y Tenor.
 */
async function gifCommand(sock, chatId, message, query) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Validar que haya una búsqueda
        if (!query || query.trim().length < 2) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎬 *BÚSQUEDA DE GIFS* ⊱━━━╮
│
│  Busca y envía GIFs animados
│  de alta calidad.
│
│  💡 *Uso:* .gif <tu búsqueda>
│  💡 *Ejemplo:* .gif gato bailando
│  💡 *Ejemplo:* .gif feliz
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Entretenimiento`,
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

        // 2. Reacción de carga
        await sock.sendMessage(chatId, { react: { text: '', key: message.key } });

        const searchQuery = query.trim();
        let gifUrl = null;
        let gifTitle = searchQuery;

        // 3. Intentar con Giphy primero (API Key desde settings o variable de entorno)
        const giphyApiKey = process.env.GIPHY_API_KEY || settings?.giphyApiKey || 'your_giphy_api_key';
        
        if (giphyApiKey && giphyApiKey !== 'your_giphy_api_key') {
            try {
                const giphyResponse = await axios.get('https://api.giphy.com/v1/gifs/search', {
                    params: {
                        api_key: giphyApiKey,
                        q: searchQuery,
                        limit: 1,
                        rating: 'g',
                        lang: 'es'
                    },
                    timeout: 10000
                });

                if (giphyResponse.data?.data?.[0]?.images?.downsized_medium?.url) {
                    gifUrl = giphyResponse.data.data[0].images.downsized_medium.url;
                    gifTitle = giphyResponse.data.data[0].title || searchQuery;
                }
            } catch (giphyError) {
                console.warn('⚠️ Giphy API falló, intentando con Tenor...');
            }
        }

        // 4. Fallback a Tenor (no requiere API key para búsqueda básica)
        if (!gifUrl) {
            try {
                const tenorResponse = await axios.get(
                    `https://tenor.googleapis.com/v2/search?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&q=${encodeURIComponent(searchQuery)}&media_filter=gif&limit=1`,
                    {
                        timeout: 10000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    }
                );

                if (tenorResponse.data?.results?.[0]?.media?.[0]?.gif?.url) {
                    gifUrl = tenorResponse.data.results[0].media[0].gif.url;
                    gifTitle = tenorResponse.data.results[0].content_description?.replace(/_/g, ' ') || searchQuery;
                }
            } catch (tenorError) {
                console.error('❌ Tenor API también falló:', tenorError.message);
            }
        }

        // 5. Si no se encontró ningún GIF
        if (!gifUrl) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `━━━⊱ ❌ *SIN RESULTADOS* ⊱━━━
│
│  🚫 No se encontraron GIFs para:
│  _"${searchQuery}"_
│
│  💡 *Sugerencias:*
│  • Verifica la ortografía
│  • Usa términos más generales
│  • Intenta en inglés
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Entretenimiento`,
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

        // 6. Enviar el GIF con diseño profesional
        await sock.sendMessage(chatId, {
            video: { url: gifUrl },
            mimetype: 'video/mp4',
            caption: `╭━━━ 🎬 *GIF ENCONTRADO* ⊱━━━╮
│
│  📝 *Búsqueda:* ${searchQuery}
│  🎭 *Título:* ${gifTitle}
│
│  ✨ ¡Disfruta tu GIF!
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            gifPlayback: true
        }, { quoted: message });

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

        // 8. Mensaje de seguimiento con el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: `🎬 *GIF completado*\n\n Búsqueda: _${searchQuery}_`,
            footer: `🤖 ${botName} | Entretenimiento`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        });

    } catch (error) {
        console.error('❌ Error en gifCommand:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `❌ *Error al buscar GIF*\n\nOcurrió un problema inesperado al buscar tu GIF. Por favor, inténtalo de nuevo en unos segundos.`,
            footer: ` ${botName} | Soporte técnico`,
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

module.exports = { gifCommand };