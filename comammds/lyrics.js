const fetch = require('node-fetch');

/**
 * Java Bot MD - Comando de Letras de Canciones (.lyrics)
 * Busca y muestra la letra de una canción con formato limpio y profesional.
 */
async function lyricsCommand(sock, chatId, message, songTitle) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Validar que se haya proporcionado el nombre de la canción
        // (Soporta tanto que venga como parámetro como que se extraiga del mensaje)
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = (songTitle || text.replace(/^\.?lyrics\s*/i, '')).trim();

        if (!query || query.length < 2) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎵 *BUSCADOR DE LETRAS* ⊱━━━╮
│
│  Encuentra la letra de tu canción
│  favorita al instante.
│
│  💡 *Uso:* .lyrics <nombre de la canción>
│  💡 *Ejemplo:* .lyrics Despacito
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Música y Entretenimiento`,
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

        // 2. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });

        // 3. Consulta a la API con Timeout (para evitar que el bot se congele)
        const apiUrl = `https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(query)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos máximo

        let data;
        try {
            const res = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                throw new Error(`API respondió con estado ${res.status}`);
            }
            data = await res.json();
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw new Error('La API de letras no respondió a tiempo o está caída.');
        }

        // 4. Procesar la respuesta
        const lyrics = data?.result?.lyrics;
        
        if (!lyrics || lyrics.trim() === '') {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🔍 *SIN RESULTADOS* ⊱━━━╮
│
│  No se encontró la letra para:
│  _"${query}"_
│
│  💡 *Consejo:* Verifica la ortografía
│  o intenta con el nombre del artista
│  junto al título (ej: "Bad Bunny Tití").
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Música y Entretenimiento`,
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

        // 5. Truncado inteligente (WhatsApp tiene un límite de ~4096 caracteres)
        // Lo dejamos en 3500 para dejar espacio al diseño de la tarjeta
        const MAX_CHARS = 3500;
        const isTruncated = lyrics.length > MAX_CHARS;
        
        // Cortar en un salto de línea para no partir palabras a la mitad
        let displayLyrics = lyrics;
        if (isTruncated) {
            const cutIndex = lyrics.lastIndexOf('\n', MAX_CHARS);
            displayLyrics = lyrics.substring(0, cutIndex > 0 ? cutIndex : MAX_CHARS) + '\n\n*(... Letra truncada por límite de caracteres de WhatsApp ...)*';
        }

        // 6. Construir el mensaje con diseño premium
        const responseText = `╭━━━⊱ 🎤 *LETRA ENCONTRADA* ⊱━━━╮
│
│  🎵 *Canción:* _${query}_
│
│  📜 *Letra:*
│  ${displayLyrics}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🎧 ¡Disfruta la música con *${botName}*!`;

        // 7. Enviar la letra con el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: responseText,
            footer: `🤖 ${botName} | Música y Entretenimiento`,
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

        // 8. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en lyricsCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE BÚSQUEDA* ⊱━━━╮
│
│  Ocurrió un problema al buscar la letra.
│  Es posible que el servicio esté saturado
│  o tu conexión sea inestable.
│
│  💡 *Intenta de nuevo en unos segundos.*
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

module.exports = { lyricsCommand };