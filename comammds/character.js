/**
 * Java Bot MD - Comando de Análisis de Carácter (.character)
 * Un comando divertido que analiza la "personalidad" de un usuario con rasgos aleatorios.
 */

async function characterCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Extraer el usuario a analizar (Mención o Respuesta)
        let userToAnalyze = null;
        
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToAnalyze = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToAnalyze = message.message.extendedTextMessage.contextInfo.participant;
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            // Soporte para mensajes efímeros
            userToAnalyze = message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant;
        }

        // 2. Si no se proporciona usuario, mostrar ayuda con diseño premium
        if (!userToAnalyze) {
            const helpMessage = `╭━━━⊱ 🔮 *ANÁLISIS DE CARÁCTER* ⊱━━━╮
│
│  Descubre los rasgos ocultos de la
│  personalidad de tus amigos.
│
│  💡 *Uso:* .character <mención o respuesta>
│  💡 *Ejemplo:* Responde a un mensaje
│  o menciona al usuario con @.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Diversión garantizada`,
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

        // 3. Obtener la foto de perfil del usuario (con fallback elegante)
        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(userToAnalyze, 'image');
        } catch {
            // Imagen de respaldo de alta calidad si no tiene foto o es privada
            profilePic = 'https://i.imgur.com/2wzGhpF.jpeg';
        }

        // 4. Lista de rasgos de personalidad en español
        const traits = [
            "Inteligente", "Creativo", "Determinado", "Ambicioso", "Cariñoso",
            "Carismático", "Confiable", "Empático", "Energético", "Amigable",
            "Generoso", "Honesto", "Divertido", "Imaginativo", "Independiente",
            "Intuitivo", "Amable", "Lógico", "Leal", "Optimista",
            "Apasionado", "Paciente", "Persistente", "Ingenioso", "Sincero",
            "Reflexivo", "Comprensivo", "Versátil", "Sabio", "Misterioso"
        ];

        // 5. Seleccionar 3 a 5 rasgos únicos aleatorios
        const numTraits = Math.floor(Math.random() * 3) + 3; // Entre 3 y 5
        const selectedTraits = [];
        
        while (selectedTraits.length < numTraits) {
            const randomTrait = traits[Math.floor(Math.random() * traits.length)];
            if (!selectedTraits.includes(randomTrait)) {
                selectedTraits.push(randomTrait);
            }
        }

        // 6. Calcular porcentajes aleatorios (entre 65% y 100% para que siempre sea positivo)
        const traitPercentages = selectedTraits.map(trait => {
            const percentage = Math.floor(Math.random() * 36) + 65;
            // Barra de progreso visual simple
            const bars = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
            return `▸ *${trait}*: ${percentage}%\n  [${bars}]`;
        });

        const overallRating = Math.floor(Math.random() * 21) + 80; // 80% - 100%
        const userName = userToAnalyze.split('@')[0];

        // 7. Diseño profesional tipo "Tarjeta" para el resultado
        const analysis = `╭━━━⊱ 🔮 *ANÁLISIS DE CARÁCTER* ⊱━━━╮
│
│  👤 *Usuario:* @${userName}
│
│  ✨ *Rasgos Principales:*
│  ${traitPercentages.join('\n  ')}
│
│  🎯 *Puntuación General:* ${overallRating}%
│
│  📝 *Nota:* Este es un análisis generado
│  aleatoriamente por IA. ¡Es solo por 
│  diversión, no lo tomes en serio! 😉
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 8. Enviar el análisis con la foto, menciones y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: analysis,
            mentions: [userToAnalyze],
            footer: `🤖 ${botName} | Diversión y Magia`,
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
        console.error('❌ Error en characterCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al analizar el carácter. ¡Inténtalo de nuevo más tarde!' 
        }, { quoted: message });
    }
}

module.exports = characterCommand;