const fetch = require('node-fetch');

/**
 * Java Bot MD - Comando de Memes (.meme)
 * Obtiene memes aleatorios de alta calidad con un sistema de respaldo infalible.
 */
async function memeCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Reacción de procesamiento para feedback inmediato
        await sock.sendMessage(chatId, { react: { text: '🎭', key: message.key } });

        let imageBuffer = null;
        let memeTitle = "Meme Aleatorio";

        // 2. Intentar obtener el meme de la API principal (Cheems)
        try {
            const res = await fetch('https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo', { 
                timeout: 10000 // 10 segundos de límite
            });
            
            if (res.ok && res.headers.get('content-type')?.includes('image')) {
                imageBuffer = await res.buffer();
                memeTitle = "Meme de Cheems 🐕";
            } else {
                throw new Error('La API principal no devolvió una imagen válida');
            }
        } catch (primaryError) {
            console.warn('⚠️ API de Cheems falló, usando respaldo:', primaryError.message);
            
            // 3. Fallback a una API de memes genérica ultra-rápida y confiable
            const fallbackRes = await fetch('https://meme-api.com/gimme', { timeout: 10000 });
            const fallbackData = await fallbackRes.json();
            
            if (fallbackData.url) {
                const imgRes = await fetch(fallbackData.url, { timeout: 10000 });
                imageBuffer = await imgRes.buffer();
                memeTitle = fallbackData.title || "Meme Aleatorio";
            } else {
                throw new Error('Ambas APIs de memes fallaron');
            }
        }

        // 4. Validar que realmente tengamos un buffer de imagen
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('El buffer de la imagen está vacío');
        }

        // 5. Construir el mensaje con diseño de tarjeta premium
        const formattedMessage = `╭━━━⊱ 🎭 *MEME DEL DÍA* ⊱━━━╮
│
│  📌 *Título:* _${memeTitle}_
│
│  😂 ¡Espero que te haya sacado
│  al menos una sonrisa!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🌟 ¡Más diversión garantizada con *${botName}*!`;

        // 6. Enviar la imagen con el BOTÓN REAL (sintaxis moderna de Baileys)
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: formattedMessage,
            footer: `🤖 ${botName} | Entretenimiento`,
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }
            ],
            headerType: 1
        }, { quoted: message });

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en memeCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE MEME* ⊱━━━╮
│
│  No se pudo obtener un meme en este
│  momento. Las APIs pueden estar
│  temporalmente saturadas.
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

module.exports = memeCommand;