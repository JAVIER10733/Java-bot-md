const fetch = require('node-fetch');

/**
 * Mensajes de buenas noches de respaldo por si la API externa falla.
 * ¡Esto garantiza que el comando NUNCA se quede sin respuesta!
 */
const GOODNIGHT_FALLBACK = [
    "🌙 Que las estrellas iluminen tus sueños y mañana despiertes con nuevas fuerzas. ¡Buenas noches!",
    "✨ Descansa, que el mundo puede esperar. Mañana será un gran día. ¡Dulces sueños!",
    "🦉 La noche es el momento perfecto para recargar energías. ¡Que descanses!",
    "🌟 Que tu almohada sea suave y tus sueños estén llenos de cosas bonitas. ¡Hasta mañana!",
    "💫 Apaga las preocupaciones y enciende tus sueños. ¡Buenas noches y que descanses!",
    "🌌 El cielo nocturno te manda un abrazo lleno de paz. ¡Dulces sueños!",
    "🛌 Hoy diste lo mejor de ti, ahora es momento de descansar. ¡Mañana más y mejor!",
    "🌠 Que la tranquilidad de la noche te acompañe hasta el amanecer. ¡Buenas noches!",
    "🌙 Cierra los ojos y deja que la magia de los sueños te lleve a un lugar maravillo. ¡Hasta mañana!",
    "✨ Recuerda: cada noche es un nuevo comienzo para un nuevo día. ¡Descansa!"
];

/**
 * Java Bot MD - Comando de Buenas Noches (.goodnight)
 * Envía un mensaje cálido y acogedor para despedir el día.
 */
async function goodnightCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        
        let goodnightText = "";

        try {
            // 1. Intentar obtener el mensaje de la API
            const res = await fetch('https://shizoapi.onrender.com/api/texts/lovenight?apikey=shizo', {
                timeout: 8000 // Tiempo límite de 8 segundos
            });
            
            if (!res.ok) {
                throw new Error('La API no respondió correctamente');
            }
            
            const json = await res.json();
            // Flexibilidad: busca el texto en diferentes formatos posibles de la API
            goodnightText = json.result || json.message || json.text || json.lovenight;
            
            if (!goodnightText || typeof goodnightText !== 'string') {
                throw new Error('La API devolvió un formato inesperado');
            }
        } catch (apiError) {
            // 2. Si la API falla, usamos un mensaje de respaldo local (¡El usuario nunca nota el error!)
            console.warn('⚠️ API de buenas noches caída, usando respaldo local:', apiError.message);
            const randomIndex = Math.floor(Math.random() * GOODNIGHT_FALLBACK.length);
            goodnightText = GOODNIGHT_FALLBACK[randomIndex];
        }

        // 3. Diseño profesional tipo "Tarjeta"
        const formattedMessage = `╭━━━⊱ 🌙 *BUENAS NOCHES* ⊱━━━╮
│
│  💌 _"${goodnightText}"_
│
│  ✨ Que descanses y recargues 
│  energías para un gran mañana.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🌟 ¡Dulces sueños con *${botName}*!`;

        // 4. Envío del mensaje con el BOTÓN REAL (sin banners molestos)
        await sock.sendMessage(chatId, {
            text: formattedMessage,
            footer: `🤖 ${botName} | Esparciendo tranquilidad`,
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
        console.error('❌ Error catastrófico en goodnight command:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `❌ *Ups, el bot se quedó dormido*\n\nNo se pudo obtener el mensaje en este momento. ¡Inténtalo de nuevo mañana!`,
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

module.exports = { goodnightCommand };