const fetch = require('node-fetch');

// Frases de respaldo por si la API externa falla o está caída.
// Esto garantiza que el comando NUNCA falle, dando una experiencia 10/10.
const FALLBACK_QUOTES = [
    "El único modo de hacer un gran trabajo es amar lo que haces. - Steve Jobs",
    "La vida es lo que pasa mientras estás ocupado haciendo otros planes. - John Lennon",
    "No cuentes los días, haz que los días cuenten. - Muhammad Ali",
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día. - Robert Collier",
    "La mejor manera de predecir el futuro es crearlo. - Peter Drucker",
    "No te detengas hasta que te sientas orgulloso. - Anónimo",
    "La disciplina es el puente entre las metas y los logros. - Jim Rohn"
];

module.exports = async function quoteCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        
        let quoteText = "";

        try {
            // Intentamos obtener la frase de la API
            const res = await fetch('https://shizoapi.onrender.com/api/texts/quotes?apikey=shizo');
            
            if (!res.ok) {
                throw new Error('La API no respondió correctamente');
            }
            
            const json = await res.json();
            // Flexibilidad: a veces las APIs cambian el nombre de la propiedad
            quoteText = json.result || json.quote || json.text || json.message;
            
            if (!quoteText || typeof quoteText !== 'string') {
                throw new Error('La API devolvió un formato inesperado');
            }
        } catch (apiError) {
            // Si la API falla, usamos una frase de respaldo local (¡Nunca fallas ante el usuario!)
            console.warn('⚠️ API de frases caída, usando respaldo local:', apiError.message);
            const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
            quoteText = FALLBACK_QUOTES[randomIndex];
        }

        // Diseño profesional tipo "Tarjeta"
        const formattedMessage = `╭━━━⊱ 💬 *FRASE DEL DÍA* ⊱━━━╮
│
│  ✨ _"${quoteText}"_
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

🌟 ¡Que esta frase te inspire a lograr grandes cosas hoy!`;

        // Envío del mensaje con el BOTÓN REAL (sin banners molestos)
        await sock.sendMessage(chatId, {
            text: formattedMessage,
            footer: `🤖 ${botName} | Inspiración diaria`,
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
        // Error catastrófico (muy poco probable gracias al fallback)
        console.error('❌ Error catastrófico en quote command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error inesperado. ¡Inténtalo de nuevo más tarde!' 
        }, { quoted: message });
    }
};