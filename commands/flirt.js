const fetch = require('node-fetch');

/**
 * Piropos y frases coquetas de respaldo por si la API externa falla.
 * ¡Esto garantiza que el comando NUNCA se quede sin respuesta!
 */
const FLIRT_FALLBACK = [
    "¿Eres un hechizo? Porque cada vez que te veo, quedo completamente encantado/a. ✨",
    "Si la belleza fuera tiempo, tú serías la eternidad. 🌹",
    "No soy fotógrafo, pero definitivamente puedo imaginarnos juntos. 📸",
    "¿Crees en el amor a primera vista o tengo que pasar otra vez por tu lado? 😉",
    "Mi café se enfrió, pero mi corazón se aceleró al leerte. ☕❤️",
    "Eres la notificación que más espero en mi día. 📱",
    "Si fueras un emoji, serías el de ojos de corazón, sin duda. 😍",
    "No necesito GPS, porque mis ojos siempre te encuentran a ti. 🧭",
    "¿Tienes un mapa? Porque me he perdido en tu mirada. 🗺️",
    "Eres la razón por la que creo que la suerte sí existe. 🍀",
    "Tu sonrisa debe ser ilegal, porque acaba de robarme toda la atención. 😏",
    "Ojalá fueras un libro, para leerte toda la noche. 📖"
];

/**
 * Java Bot MD - Comando de Piropos (.flirt)
 * Envía una frase coqueta, divertida y respetuosa para alegrar el día.
 */
async function flirtCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        
        let flirtText = "";

        try {
            // 1. Intentar obtener el piropo de la API
            const res = await fetch('https://shizoapi.onrender.com/api/texts/flirt?apikey=shizo', {
                timeout: 8000 // Tiempo límite de 8 segundos
            });
            
            if (!res.ok) {
                throw new Error('La API no respondió correctamente');
            }
            
            const json = await res.json();
            // Flexibilidad: busca el texto en diferentes formatos posibles de la API
            flirtText = json.result || json.flirt || json.text || json.message;
            
            if (!flirtText || typeof flirtText !== 'string') {
                throw new Error('La API devolvió un formato inesperado');
            }
        } catch (apiError) {
            // 2. Si la API falla, usamos un piropo de respaldo local (¡El usuario nunca nota el error!)
            console.warn('⚠️ API de piropos caída, usando respaldo local:', apiError.message);
            const randomIndex = Math.floor(Math.random() * FLIRT_FALLBACK.length);
            flirtText = FLIRT_FALLBACK[randomIndex];
        }

        // 3. Diseño profesional tipo "Tarjeta"
        const formattedMessage = `╭━━━⊱ 💘 *MENSAJE ESPECIAL* ⊱━━━╮
│
│  💌 _"${flirtText}"_
│
│  ✨ ¡Alguien piensa en ti! 
│  Que tengas un día tan lindo como tú.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🌟 ¡La magia está garantizada con *${botName}*!`;

        // 4. Envío del mensaje con el BOTÓN REAL (sin banners molestos)
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

    } catch (error) {
        // Error catastrófico (extremadamente raro gracias al fallback)
        console.error('❌ Error catastrófico en flirt command:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `❌ *Ups, el cupido del bot está descansando*\n\nNo se pudo obtener el mensaje en este momento. ¡Inténtalo de nuevo más tarde!`,
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

module.exports = { flirtCommand };