const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        // Usamos JokeAPI que soporta español y permite filtrar contenido inapropiado
        const response = await axios.get('https://v2.jokeapi.dev/joke/Any?lang=es&blacklistFlags=nsfw,religious,political,racist,sexist,explicit');
        const data = response.data;

        // Formatear el chiste dependiendo de si es de una parte o de pregunta/respuesta
        let jokeContent = '';
        if (data.type === 'single') {
            jokeContent = data.joke;
        } else {
            jokeContent = `❓ *Pregunta:* ${data.setup}\n\n💡 *Respuesta:* ${data.delivery}`;
        }

        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // Diseño profesional del mensaje
        const jokeMessage = `╭━━━⊱ 😂 *CHISTE DEL DÍA* ⊱━━━╮
│
│ 🏷️ *Categoría:* ${data.category}
│ 
│ ${jokeContent}
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

😆 ¡Espero que te haya sacado al menos una sonrisa!`;

        // Envío del mensaje con el BOTÓN REAL (sin el banner molesto de reenvío)
        await sock.sendMessage(chatId, {
            text: jokeMessage,
            footer: `🤖 ${botName} | Diversión garantizada`,
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
        console.error('❌ Error al obtener el chiste:', error);
        await sock.sendMessage(chatId, { 
            text: '😅 Ups, los comedores del bot se quedaron sin ideas. ¡Inténtalo de nuevo en un momento!' 
        }, { quoted: message });
    }
};