const fetch = require('node-fetch');

/**
 * Preguntas de "Verdad" de respaldo por si la API externa falla.
 * ¡Esto garantiza que el juego NUNCA se quede sin preguntas!
 */
const TRUTH_FALLBACK = [
    "¿Cuál es la mentira más grande que has dicho y nadie descubrió? 🤥",
    "¿Quién de este grupo te parece más atractivo/a y por qué? 👀",
    "¿Cuál es tu mayor miedo irracional que te da vergüenza admitir? 😨",
    "¿Qué es lo más vergonzoso que te ha pasado en público? 🙈",
    "¿Alguna vez has stalkeado a tu ex en redes sociales? 🕵️‍♂️",
    "¿Cuál es el secreto más grande que le has ocultado a tu familia? 🤫",
    "¿Quién fue tu primer crush (amor platónico) de la infancia? 💘",
    "¿Qué es lo más raro o vergonzoso que has buscado en Google? 🔍",
    "¿Alguna vez te han descubierto mintiendo? ¿Cómo reaccionaste? 😳",
    "¿Cuál es la travesura más grande que hiciste cuando eras niño? 👦",
    "¿A quién de este grupo le confiarías un secreto de vida o muerte? 🤝",
    "¿Qué es lo que más te molesta de la persona que envió el último mensaje? 😤",
    "¿Has fingido estar enfermo para no ir a trabajar o estudiar? 🤒",
    "¿Cuál es tu guilty pleasure (placer culposo) en series, música o comida? 🍿",
    "¿Alguna vez enviaste un mensaje a la persona equivocada? ¿Qué decía? 📱",
    "Si pudieras borrar un momento de tu pasado, ¿cuál sería? ⏪",
    "¿Cuál ha sido la excusa más creativa que has inventado para cancelar un plan? 🏃‍♂️",
    "¿Qué es lo primero que te fijas en una persona cuando la conoces? 👁️"
];

/**
 * Java Bot MD - Comando de Verdad (.truth)
 * Genera una pregunta de "Verdad" aleatoria para el clásico juego de Verdad o Reto.
 */
async function truthCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        
        let truthText = "";

        // 1. Reacción de procesamiento para feedback inmediato
        await sock.sendMessage(chatId, { react: { text: '🤔', key: message.key } });

        try {
            // 2. Intentar obtener la pregunta de la API con timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos máximo

            const res = await fetch('https://shizoapi.onrender.com/api/texts/truth?apikey=shizo', { 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                throw new Error('La API no respondió correctamente');
            }
            
            const json = await res.json();
            // Flexibilidad: busca el texto en diferentes formatos posibles de la API
            truthText = json.result || json.message || json.text || json.truth;
            
            if (!truthText || typeof truthText !== 'string') {
                throw new Error('La API devolvió un formato inesperado');
            }
        } catch (apiError) {
            // 3. Si la API falla, usamos una pregunta de respaldo local (¡El usuario nunca nota el error!)
            console.warn('⚠️ API de Truth caída, usando respaldo local:', apiError.message);
            const randomIndex = Math.floor(Math.random() * TRUTH_FALLBACK.length);
            truthText = TRUTH_FALLBACK[randomIndex];
        }

        // 4. Diseño profesional tipo "Tarjeta"
        const formattedMessage = `╭━━━⊱ 🎭 *VERDAD O RETO* ⊱━━━╮
│
│  🤔 *MODO: VERDAD*
│
│  ❓ _"${truthText}"_
│
│  ⚠️ *Regla:* ¡Debes responder con 
│  total sinceridad! No se vale 
│  mentir ni saltarse la pregunta.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🎲 ¿Te atreves a responder o prefieres un reto? Escribe *.dare*`;

        // 5. Envío del mensaje con el BOTÓN REAL (sin banners molestos)
        await sock.sendMessage(chatId, {
            text: formattedMessage,
            footer: `🤖 ${botName} | Juegos de Grupo`,
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
        console.error('❌ Error catastrófico en truth command:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ *Ups, el juego se ha pausado*\n\nNo se pudo obtener la pregunta en este momento. ¡Inténtalo de nuevo más tarde!`,
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

module.exports = { truthCommand };