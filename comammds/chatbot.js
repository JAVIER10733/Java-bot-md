async function characterCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        let userToAnalyze = null;
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToAnalyze = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToAnalyze = message.message.extendedTextMessage.contextInfo.participant;
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            userToAnalyze = message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToAnalyze) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🔮 *ANÁLISIS DE CARÁCTER* ⊱━━━╮\n│\n│  💡 *Uso:* .character <mención o respuesta>\n│  💡 *Ejemplo:* Responde a un mensaje\n│  o menciona al usuario con @.\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Diversión garantizada`,
                buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: channelLink, merchant_url: channelLink }) }],
                headerType: 1
            }, { quoted: message });
        }

        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(userToAnalyze, 'image');
        } catch {
            profilePic = 'https://i.imgur.com/2wzGhpF.jpeg';
        }

        const traits = ["Inteligente", "Creativo", "Determinado", "Ambicioso", "Cariñoso", "Carismático", "Confiable", "Empático", "Energético", "Amigable", "Generoso", "Honesto", "Divertido", "Imaginativo", "Independiente", "Intuitivo", "Amable", "Lógico", "Leal", "Optimista", "Apasionado", "Paciente", "Persistente", "Ingenioso", "Sincero", "Reflexivo", "Comprensivo", "Versátil", "Sabio", "Misterioso"];
        const selectedTraits = [];
        while (selectedTraits.length < Math.floor(Math.random() * 3) + 3) {
            const randomTrait = traits[Math.floor(Math.random() * traits.length)];
            if (!selectedTraits.includes(randomTrait)) selectedTraits.push(randomTrait);
        }

        const traitPercentages = selectedTraits.map(trait => {
            const percentage = Math.floor(Math.random() * 36) + 65;
            const bars = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
            return `▸ *${trait}*: ${percentage}%\n  [${bars}]`;
        });

        const overallRating = Math.floor(Math.random() * 21) + 80;
        const userName = userToAnalyze.split('@')[0];

        const analysis = `╭━━━⊱ 🔮 *ANÁLISIS DE CARÁCTER* ⊱━━━╮\n│\n│  👤 *Usuario:* @${userName}\n│\n│  ✨ *Rasgos Principales:*\n│  ${traitPercentages.join('\n  ')}\n│\n│  🎯 *Puntuación General:* ${overallRating}%\n│\n│  📝 *Nota:* Este es un análisis generado\n│  aleatoriamente. ¡Es solo por diversión!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: analysis,
            mentions: [userToAnalyze],
            footer: `🤖 ${botName} | Diversión y Magia`,
            buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: channelLink, merchant_url: channelLink }) }],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en characterCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al analizar el carácter. ¡Inténtalo de nuevo!' }, { quoted: message });
    }
}

module.exports = characterCommand;