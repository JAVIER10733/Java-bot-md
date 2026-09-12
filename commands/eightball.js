/**
 * Java Bot MD - Comando de la Bola 8 Mágica (.8ball)
 * Versión Ultimate: Respuestas inmersivas, UI premium, anti-spam y analítica integrada.
 */

const RESPONSES = [
    "✨ Es absolutamente cierto.", "🌟 Sin lugar a dudas, sí.", "💫 Sí, definitivamente.",
    "🔮 Puedes confiar en ello.", "⭐ Como yo lo veo, sí.", "🌙 Muy probable.",
    "☀️ Las perspectivas son excelentes.", "🍀 Sí, y la suerte está de tu lado.",
    "🌈 Los astros se alinean a tu favor.", "👑 El destino ha hablado: sí.",
    "🤔 Respuesta confusa, intenta de nuevo.", "⏳ Pregunta de nuevo más tarde.",
    "🌫️ Mejor no decirte ahora...", "🎭 No puedo predecirlo en este momento.",
    "🧘 Concéntrate y pregunta de nuevo.", "🔍 La respuesta se revelará pronto.",
    "🌀 Las energías están demasiado revueltas.", "🃏 El universo guarda silencio.",
    "❌ No cuentes con ello.", "🚫 Mi respuesta es no.",
    "⚠️ Mis fuentes dicen que no.", "🌑 Las perspectivas no son buenas.",
    "💔 Muy dudoso.", "🙅 Definitivamente no.",
    "🌧️ No en este momento.", "🛑 Las señales apuntan a que no.",
    "📉 Las probabilidades están en tu contra.", "🚪 Esa puerta está cerrada.",
    "😂 ¡Ja! En tus sueños.", "🤡 Ni lo sueñes.",
    "🧙‍♂️ La magia dice que no.", "🦉 La lechuza niega tu deseo.",
    "🔥 Arderá antes de que eso pase.", "🧊 Congela esa idea, no va a pasar.",
    "🎲 Los dados han caído en tu contra.", "🧭 Tu brújula apunta al fracaso.",
    "🌻 ¡Sí, florecerá!", "🦋 Un cambio positivo está por llegar.",
    "🎵 La melodía del universo dice que sí.", "🚀 Despega con confianza, es un sí.",
    "🧲 Atraerás esa realidad.", "🗝️ Tienes la llave, la respuesta es sí.",
    "🛡️ Estás protegido, adelante.", "🏰 Construye ese castillo, es viable.",
    "🧪 La fórmula es correcta: sí.", "📜 Está escrito en las estrellas.",
    "🎭 Depende de tu actuación.", "⚖️ La balanza está equilibrada, decide tú.",
    "🕰️ El tiempo lo dirá, pero me inclino por sí.", "🎁 Es un regalo del destino."
];

async function eightBallCommand(sock, chatId, message, question) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        const senderJid = message.key.participant || message.key.remoteJid;
        const userName = senderJid.split('@')[0];

        if (!question || question.trim().length < 3) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎱 *BOLA 8 MÁGICA* ⊱━━━╮\n│\n│  ❓ *Error:* Tu pregunta es demasiado corta.\n│  💡 *Uso:* .8ball ¿Tendré éxito hoy?\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Misticismo Digital`,
                buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal', url: channelLink, merchant_url: channelLink }) }],
                headerType: 1
            }, { quoted: message });
        }

        await sock.sendPresenceUpdate('composing', chatId);
        const delay = Math.min(3500, Math.max(1500, question.length * 40));
        await new Promise(resolve => setTimeout(resolve, delay));
        await sock.sendPresenceUpdate('paused', chatId);

        const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
        const cleanQuestion = question.length > 90 ? question.substring(0, 90) + '...' : question;
        
        console.log(`[8BALL] ${userName} preguntó: "${question}" -> Respuesta: "${response}"`);

        const finalMessage = `╭━━━⊱ 🎱 *LA BOLA 8 HA HABLADO* ⊱━━━╮
│
│  👤 *Consultante:* @${userName}
│  ❓ *Pregunta:* _"${cleanQuestion}"_
│
│  🔮 *Respuesta del Universo:*
│  ${response}
│
│  💫 _Recuerda: tu destino lo construyes tú._
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: finalMessage,
            mentions: [senderJid],
            footer: `🤖 ${botName} | Misticismo Digital`,
            buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: channelLink, merchant_url: channelLink }) }],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('❌ [8BALL] Error crítico:', error);
        await sock.sendMessage(chatId, { text: '❌ La bola 8 se ha fracturado. Inténtalo de nuevo más tarde.' }, { quoted: message });
    }
}

module.exports = { eightBallCommand };