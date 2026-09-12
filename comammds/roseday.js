const fetch = require('node-fetch');

/**
 * Frases de Día de las Rosas de respaldo por si la API externa falla.
 * ¡Esto garantiza que el comando NUNCA se quede sin respuesta!
 */
const ROSEDAY_FALLBACK = [
    "Que tu vida esté siempre llena de rosas, amor y mucha felicidad. ¡Feliz Día de las Rosas! 🌹",
    "Una rosa puede marchitarse con el tiempo, pero el amor verdadero florece para siempre. 💖",
    "Hoy te regalo una rosa virtual, pero mi cariño y admiración por ti son reales y eternos. 🌹✨",
    "Que este Día de las Rosas traiga a tu vida tantos colores y fragancias como la felicidad que mereces. 🌸",
    "No necesito un jardín entero, solo una rosa tuya para ser la persona más feliz del mundo. 🥀❤️",
    "Las rosas son rojas, pero mi admiración por ti no tiene límites. ¡Feliz día! 🌹",
    "Que cada pétalo de esta rosa te recuerde lo especial y valioso/a que eres para quienes te rodean. 🌹💫",
    "El amor es como una rosa: hay que cuidarlo todos los días para que nunca deje de florecer. 🌹🌱"
];

/**
 * Java Bot MD - Comando de Día de las Rosas (.roseday)
 * Envía una frase romántica, cálida y elegante para celebrar esta fecha.
 */
async function rosedayCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        
        let rosedayText = "";

        // 1. Reacción de procesamiento para feedback inmediato
        await sock.sendMessage(chatId, { react: { text: '🌹', key: message.key } });

        try {
            // 2. Intentar obtener la frase de la API
            const res = await fetch('https://api.princetechn.com/api/fun/roseday?apikey=prince', {
                timeout: 8000 // Tiempo límite de 8 segundos
            });
            
            if (!res.ok) {
                throw new Error('La API no respondió correctamente');
            }
            
            const json = await res.json();
            // Flexibilidad: busca el texto en diferentes formatos posibles de la API
            rosedayText = json.result || json.message || json.text || json.quote;
            
            if (!rosedayText || typeof rosedayText !== 'string') {
                throw new Error('La API devolvió un formato inesperado');
            }
        } catch (apiError) {
            // 3. Si la API falla, usamos una frase de respaldo local (¡El usuario nunca nota el error!)
            console.warn('⚠️ API de Roseday caída, usando respaldo local:', apiError.message);
            const randomIndex = Math.floor(Math.random() * ROSEDAY_FALLBACK.length);
            rosedayText = ROSEDAY_FALLBACK[randomIndex];
        }

        // 4. Diseño profesional tipo "Tarjeta"
        const formattedMessage = `╭━━━⊱ 🌹 *DÍA DE LAS ROSAS* ⊱━━━╮
│
│  💌 _"${rosedayText}"_
│
│  ✨ Que tu día esté lleno de amor, 
│  alegría y hermosos momentos.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🌟 ¡Celebremos juntos con *${botName}*!`;

        // 5. Envío del mensaje con el BOTÓN REAL (sin banners molestos)
        await sock.sendMessage(chatId, {
            text: formattedMessage,
            footer: `🤖 ${botName} | Esparciendo amor`,
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
        console.error('❌ Error catastrófico en roseday command:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ *Ups, las rosas se han marchitado temporalmente*\n\nNo se pudo obtener la frase en este momento. ¡Inténtalo de nuevo más tarde!`,
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

module.exports = { rosedayCommand };