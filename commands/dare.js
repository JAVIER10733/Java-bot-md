const fetch = require('node-fetch');

/**
 * Retos de respaldo por si la API externa falla o está caída.
 * ¡Esto garantiza que el comando NUNCA se quede sin respuesta!
 */
const DARES_FALLBACK = [
    "🔥 Manda un audio cantando tu canción favorita (aunque cantes mal).",
    "😈 Confiesa tu secreto más vergonzoso en este grupo.",
    "🤡 Cambia tu foto de perfil por la de un payaso durante 1 hora.",
    "💬 Escribe 'Te quiero mucho' al tercer contacto de tu lista de WhatsApp y manda captura.",
    "📸 Manda una foto de lo que estás haciendo ahora mismo (sin filtros).",
    "🎭 Imita el sonido de un animal durante 10 segundos en un audio.",
    "📱 Deja que el grupo elija tu estado de WhatsApp por las próximas 24 horas.",
    "🤐 Di una verdad incómoda sobre ti mismo que casi nadie sepa.",
    "📞 Llama a un contacto aleatorio y dile 'Creo que me siguen, ayúdame' y cuelga.",
    "🍕 Confiesa cuál es tu comida favorita y por qué te hace sentir culpable.",
    "🕺 Manda un video de 5 segundos bailando tu canción favorita.",
    "🤖 Escribe todos tus mensajes en mayúsculas durante los próximos 10 minutos."
];

/**
 * Java Bot MD - Comando de Retos (.dare)
 * Envía un reto aleatorio y divertido para el usuario.
 */
async function dareCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        
        let dareText = "";

        try {
            // 1. Intentar obtener el reto de la API
            const res = await fetch('https://shizoapi.onrender.com/api/texts/dare?apikey=shizo', {
                timeout: 8000 // Tiempo límite de 8 segundos
            });
            
            if (!res.ok) {
                throw new Error('La API no respondió correctamente');
            }
            
            const json = await res.json();
            // Flexibilidad: busca el texto en diferentes formatos posibles de la API
            dareText = json.result || json.dare || json.text || json.message;
            
            if (!dareText || typeof dareText !== 'string') {
                throw new Error('La API devolvió un formato inesperado');
            }
        } catch (apiError) {
            // 2. Si la API falla, usamos un reto de respaldo local (¡El usuario nunca nota el error!)
            console.warn('⚠️ API de retos caída, usando respaldo local:', apiError.message);
            const randomIndex = Math.floor(Math.random() * DARES_FALLBACK.length);
            dareText = DARES_FALLBACK[randomIndex];
        }

        // 3. Diseño profesional tipo "Tarjeta"
        const formattedMessage = `╭━━━⊱ 🔥 *RETO ALEATORIO* ⊱━━━╮
│
│  😈 _"${dareText}"_
│
│  🎲 ¡Atrévete a cumplirlo y envía 
│  la prueba al grupo! ¿Te atreves o te ahuevas mij@?
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🌟 ¡La diversión está garantizada con *${botName}*!`;

        // 4. Envío del mensaje con el BOTÓN REAL (sin banners molestos)
        await sock.sendMessage(chatId, {
            text: formattedMessage,
            footer: `🤖 ${botName} | Diversión y Retos`,
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
        console.error('❌ Error catastrófico en dare command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error inesperado al buscar el reto. ¡Inténtalo de nuevo más tarde!' 
        }, { quoted: message });
    }
}

module.exports = { dareCommand };