/**
 * Java Bot MD - Comando de Insultos / Roast (.insult)
 * Envía un comentario sarcástico y divertido para molestar a un amigo en el grupo.
 */

const INSULTS = [
    "Eres como una nube. Cuando desapareces, ¡es un día hermoso! ☁️",
    "Traes mucha alegría a todos... ¡justo cuando sales de la sala! 🚪",
    "Yo estaría de acuerdo contigo, pero entonces ambos estaríamos equivocados. 🤷‍♂️",
    "No eres tonto, solo tienes mala suerte pensando. 🧠",
    "Eres la prueba viviente de que incluso la evolución a veces se toma un descanso. 🦕",
    "Eres como una actualización de software: cada vez que apareces, pienso '¿realmente necesito esto ahora?'. 💻",
    "Tienes algo único: tu capacidad de molestar a todos por igual. 🏆",
    "Tu energía es como un agujero negro: solo absorbe la vida de la habitación. 🕳️",
    "Eres como un atasco de tráfico: nadie te quiere, pero aquí estás. 🚗",
    "Eres como un lápiz roto: no tienes punta (ni sentido). ✏️",
    "Tu cerebro funciona con Windows 95: lento, ruidoso y desactualizado. 💾",
    "Eres como un bache en la carretera: a nadie le gustas, pero todos tienen que lidiar contigo. 🛣️",
    "Tienes la cara perfecta para la radio. 📻",
    "Eres la razón por la que ponen instrucciones en las botellas de champú. 🧴",
    "Tus chistes son como la leche caducada: agrios y difíciles de digerir. 🥛",
    "Eres como una señal de Wi-Fi: siempre débil cuando más se te necesita. 📶",
    "Eres como una nube de mosquitos: simplemente irritante. 🦟",
    "Unes a la gente... para que hablen de lo molesto que eres. 🗣️",
    "Si la pereza fuera un deporte, serías olímpico. 🥇",
    "Eres tan original que estoy seguro de que ya he escuchado todo lo que vas a decir. 🦜"
];

async function insultCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Extraer el usuario objetivo (Mención, Respuesta o Mensaje Efímero)
        let userToInsult = null;
        
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToInsult = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToInsult = message.message.extendedTextMessage.contextInfo.participant;
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            userToInsult = message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant;
        }

        // 2. Si no se encuentra usuario, mostrar ayuda con diseño premium
        if (!userToInsult) {
            const helpMessage = `╭━━━⊱ 🔥 *MODO ROAST / INSULTO* ⊱━━━╮
│
│  Envía un comentario sarcástico y 
│  divertido para molestar a un amigo.
│
│  💡 *Uso:* .insult <mención o respuesta>
│  💡 *Ejemplo:* Responde a un mensaje
│  o menciona al usuario con @.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Diversión y Roasts`,
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

        // 3. Seleccionar un insulto aleatorio
        const randomInsult = INSULTS[Math.floor(Math.random() * INSULTS.length)];
        const userName = userToInsult.split('@')[0];

        // 4. Pequeño retraso para evitar rate limits inmediatos
        await new Promise(resolve => setTimeout(resolve, 800));

        // 5. Construir el mensaje con diseño de tarjeta premium
        const insultMessage = `╭━━━⊱ 💀 *MENSAJE PARA TI* ⊱━━━╮
│
│  👤 *Para:* @${userName}
│
│  🔥 _"${randomInsult}"_
│
│  😂 ¡Es solo una broma! No te lo 
│  tomes en serio, es por diversión.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 6. Enviar el roast con menciones y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: insultMessage,
            mentions: [userToInsult],
            footer: `🤖 ${botName} | Diversión y Roasts`,
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
        console.error('❌ Error en insultCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `❌ *Ups, algo salió mal*\n\nNo se pudo enviar el mensaje en este momento. Por favor, inténtalo de nuevo en unos segundos.`,
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

module.exports = { insultCommand };