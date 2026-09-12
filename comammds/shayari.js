const fetch = require('node-fetch');

/**
 * Frases poéticas (Shayari) de respaldo por si la API externa falla.
 * ¡Esto garantiza que el comando NUNCA se quede sin respuesta!
 */
const SHAYARI_FALLBACK = [
    "Eres el poema que nunca supe escribir, pero que mi corazón recita todos los días. 📜✨",
    "En el jardín de la vida, tú eres la flor que le da sentido a mi primavera. 🌸",
    "No cuento los días, cuento los momentos que a tu lado se convierten en eternidad. ⏳❤️",
    "Tu voz es la melodía que mi alma necesita para encontrar la paz. 🎶",
    "Como las estrellas en la noche, tu presencia ilumina hasta mis días más oscuros. 🌟",
    "El tiempo se detiene cuando mis ojos se encuentran con los tuyos. 🕰️",
    "Eres la respuesta a todas las preguntas que mi corazón le hacía al universo. 🌌",
    "El amor no se mira, se siente, y aún más se demuestra cuando se vive. 💖",
    "Si la vida fuera un lienzo, tú serías el color que lo hace una obra de arte. 🎨",
    "No necesito que el mundo sea perfecto, solo necesito que tú estés en él. 🌍✨"
];

/**
 * Java Bot MD - Comando de Poesía / Shayari (.shayari)
 * Envía una frase poética, romántica y profunda para inspirar o enamorar.
 */
async function shayariCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        
        let shayariText = "";

        // 1. Reacción de procesamiento para feedback inmediato
        await sock.sendMessage(chatId, { react: { text: '🪄', key: message.key } });

        try {
            // 2. Intentar obtener la frase de la API con timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos máximo

            const res = await fetch('https://shizoapi.onrender.com/api/texts/shayari?apikey=shizo', { 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                throw new Error('La API no respondió correctamente');
            }
            
            const json = await res.json();
            // Flexibilidad: busca el texto en diferentes formatos posibles de la API
            shayariText = json.result || json.message || json.text || json.shayari;
            
            if (!shayariText || typeof shayariText !== 'string') {
                throw new Error('La API devolvió un formato inesperado');
            }
        } catch (apiError) {
            // 3. Si la API falla, usamos una frase de respaldo local (¡El usuario nunca nota el error!)
            console.warn('⚠️ API de Shayari caída, usando respaldo local:', apiError.message);
            const randomIndex = Math.floor(Math.random() * SHAYARI_FALLBACK.length);
            shayariText = SHAYARI_FALLBACK[randomIndex];
        }

        // 4. Diseño profesional tipo "Tarjeta"
        const formattedMessage = `╭━━━⊱ 📜 *POESÍA Y FRASES* ⊱━━━╮
│
│  💌 _"${shayariText}"_
│
│  ✨ Que estas palabras lleguen a 
│  tu corazón y te inspiren hoy.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🌟 ¡Más magia y poesía con *${botName}*!`;

        // 5. Envío del mensaje con el BOTÓN REAL (sintaxis moderna de Baileys)
        await sock.sendMessage(chatId, {
            text: formattedMessage,
            footer: `🤖 ${botName} | Inspiración diaria`,
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

        // 6. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        // Error catastrófico (extremadamente raro gracias al fallback)
        console.error('❌ Error catastrófico en shayari command:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ *Ups, la musa del bot está descansando*\n\nNo se pudo obtener la frase en este momento. ¡Inténtalo de nuevo más tarde!`,
            footer: `🤖 ${botName} | Soporte`,
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

module.exports = { shayariCommand };