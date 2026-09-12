const axios = require('axios');

// Datos curiosos de respaldo por si la API externa falla.
// ¡Así el comando NUNCA se queda sin respuesta!
const FALLBACK_FACTS = [
    "🐙 Los pulpos tienen tres corazones: dos bombean sangre a las branquias y uno al resto del cuerpo.",
    "🍯 La miel es el único alimento que no se echa a perder. Se ha encontrado miel comestible en tumbas egipcias de hace 3000 años.",
    "🦈 Los tiburones existen desde antes que los árboles. Aparecieron hace unos 400 millones de años.",
    "🧠 El cerebro humano genera suficiente electricidad como para encender una bombilla pequeña.",
    "🐌 Un caracol puede dormir hasta 3 años seguidos si las condiciones climáticas no son favorables.",
    "🌍 Un día en Venus es más largo que un año en Venus. Tarda 243 días terrestres en girar sobre su eje, pero solo 225 en orbitar al Sol.",
    "🐘 Los elefantes son los únicos animales que no pueden saltar."
];

module.exports = async function (sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        
        let factText = "";

        try {
            // Solicitamos el dato curioso específicamente en español
            const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=es', {
                timeout: 5000 // Tiempo límite de 5 segundos para evitar bloqueos
            });
            
            factText = response.data.text;
            
            // Validación por si la API devuelve algo inesperado
            if (!factText || typeof factText !== 'string') {
                throw new Error('La API devolvió un formato inesperado');
            }
        } catch (apiError) {
            // Si la API falla, usamos un dato de respaldo local (¡El usuario nunca nota el error!)
            console.warn('⚠️ API de datos curiosos caída, usando respaldo local:', apiError.message);
            const randomIndex = Math.floor(Math.random() * FALLBACK_FACTS.length);
            factText = FALLBACK_FACTS[randomIndex];
        }

        // Diseño profesional tipo "Tarjeta"
        const formattedMessage = `╭━━━⊱ 🧠 *DATO CURIOSO* ⊱━━━╮
│
│  💡 ${factText}
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

🌟 ¡Aprende algo nuevo cada día con *${botName}*!`;

        // Envío del mensaje con el BOTÓN REAL (sin banners molestos)
        await sock.sendMessage(chatId, {
            text: formattedMessage,
            footer: `🤖 ${botName} | Conocimiento al instante`,
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }
            ],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        // Error catastrófico (extremadamente raro gracias al fallback)
        console.error('❌ Error catastrófico en fact command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error inesperado al buscar el dato. ¡Inténtalo de nuevo más tarde!' 
        }, { quoted: message });
    }
};