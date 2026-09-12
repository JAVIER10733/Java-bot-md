/**
 * Java Bot MD - Comando de Halagos (.compliment)
 * Envía un mensaje positivo y aleatorio para alegrar el día de un usuario.
 */

const COMPLIMENTS = [
    "Eres increíble tal y como eres. ¡Nunca cambies! ✨",
    "Tienes un sentido del humor que alegra el día a cualquiera. 😄",
    "Tu amabilidad y empatía hacen del mundo un lugar mucho mejor. 💖",
    "Eres mucho más fuerte y capaz de lo que tú mismo crees. 💪",
    "Tu energía positiva es absolutamente contagiosa. ☀️",
    "Tienes un corazón de oro y se nota en todo lo que haces. 💛",
    "Inspiras a los que te rodean a ser mejores personas. 🌟",
    "Tu creatividad no tiene límites, siempre nos sorprendes. 🎨",
    "Tienes un talento natural para hacer sentir especial a los demás. 🤗",
    "Tu sonrisa tiene el poder de iluminar hasta el día más gris. 😊",
    "Admiro profundamente tu ética de trabajo y tu dedicación. 💼",
    "Eres un amigo/a leal y verdadero/a, y eso vale oro. 🤝",
    "Tu perspectiva única de la vida es realmente fascinante. 🧠",
    "Tu entusiasmo es motivador, ¡nunca pierdas esa chispa! 🔥",
    "Tienes una belleza interior que brilla más que cualquier otra cosa. 💎",
    "Eres un excelente oyente y siempre sabes dar el mejor consejo. 👂",
    "Tu generosidad no conoce límites, gracias por ser así. 🎁",
    "Tienes un don especial para encontrar el lado bueno de las cosas. 🌈",
    "El mundo necesita más personas con tu integridad y valores. 🌍",
    "Simplemente, eres una obra de arte en un mundo de copias. 🖼️"
];

async function complimentCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Extraer el usuario objetivo (Mención, Respuesta o Mensaje Efímero)
        let userToCompliment = null;
        
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.participant;
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant;
        }

        // 2. Si no se encuentra usuario, mostrar ayuda con diseño premium
        if (!userToCompliment) {
            const helpMessage = `╭━━━⊱ 💖 *HALAGO ESPECIAL* ⊱━━━╮
│
│  Envía un mensaje positivo para 
│  alegrar el día de alguien.
│
│  💡 *Uso:* .compliment <mención o respuesta>
│  💡 *Ejemplo:* Responde a un mensaje
│  o menciona al usuario con @.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Buena vibra`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }],
                headerType: 1
            }, { quoted: message });
        }

        // 3. Seleccionar un halago aleatorio
        const randomCompliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
        const userName = userToCompliment.split('@')[0];

        // 4. Pequeño retraso para evitar rate limits inmediatos
        await new Promise(resolve => setTimeout(resolve, 800));

        // 5. Construir el mensaje con diseño de tarjeta premium
        const complimentMessage = `╭━━━⊱ 💌 *MENSAJE PARA TI* ⊱━━━╮
│
│  👤 *Para:* @${userName}
│
│  ✨ _"${randomCompliment}"_
│
│  🌟 ¡Que tengas un día tan maravilloso
│  como la energía que transmites!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 6. Enviar el halago con menciones y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: complimentMessage,
            mentions: [userToCompliment],
            footer: `🤖 ${botName} | Esparciendo positividad`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en complimentCommand:', error);
        
        // Manejo de errores elegante y sin anidación excesiva
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `❌ *Ups, algo salió mal*\n\nNo se pudo enviar el halago en este momento. Por favor, inténtalo de nuevo en unos segundos.`,
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

module.exports = { complimentCommand };