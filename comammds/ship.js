/**
 * Java Bot MD - Comando de Compatibilidad / Ship (.ship)
 * Calcula el porcentaje de amor aleatorio entre dos miembros del grupo con un veredicto divertido.
 */
async function shipCommand(sock, chatId, msg) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Diversión`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }],
                headerType: 1
            }, { quoted: msg });
        }

        // 2. Obtener participantes del grupo
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants.map(p => p.id);

        if (participants.length < 2) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Se necesitan al menos 2 personas en el grupo para hacer un ship.' 
            }, { quoted: msg });
        }

        // 3. Seleccionar 2 usuarios aleatorios (excluyendo al bot para más diversión)
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const eligibleParticipants = participants.filter(id => id !== botId);
        
        // Si solo queda 1 persona (el bot y otro usuario), usamos la lista completa
        const pool = eligibleParticipants.length >= 2 ? eligibleParticipants : participants;

        let firstUser = pool[Math.floor(Math.random() * pool.length)];
        let secondUser;
        
        do {
            secondUser = pool[Math.floor(Math.random() * pool.length)];
        } while (secondUser === firstUser);

        // 4. Calcular porcentaje de compatibilidad (1% a 100%)
        const percentage = Math.floor(Math.random() * 101);
        
        // 5. Determinar el veredicto y el emoji según el porcentaje
        let shipMessage = "";
        let emoji = "";
        
        if (percentage < 30) {
            shipMessage = "Uff... necesitan trabajar mucho en ello, o quizás solo estén destinados a ser buenos amigos. 😅";
            emoji = "💔";
        } else if (percentage < 60) {
            shipMessage = "Hay potencial, ¡pero hay que echarle ganas, comunicación y mucha paciencia! 😏";
            emoji = "💛";
        } else if (percentage < 85) {
            shipMessage = "¡Wow! Tienen una química increíble. ¡El amor definitivamente está en el aire! 💖";
            emoji = "❤️";
        } else {
            shipMessage = "¡HECHOS EL UNO PARA EL OTRO! 💍 El destino los ha unido, ¡felicidades a la nueva pareja! 🥂";
            emoji = "💍";
        }

        const user1Name = firstUser.split('@')[0];
        const user2Name = secondUser.split('@')[0];

        // 6. Construir el mensaje con diseño de tarjeta premium
        const formattedMessage = `╭━━━⊱ 💘 *COMPATIBILIDAD AMOROSA* ⊱━━━╮
│
│  👤 *@${user1Name}*  +  *@${user2Name}*
│
│  💖 *Compatibilidad:* ${percentage}%
│  ${emoji} *Veredicto:* ${shipMessage}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🎉 ¡Felicidades a la nueva pareja del grupo!`;

        // 7. Enviar el mensaje con menciones reales y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: formattedMessage,
            mentions: [firstUser, secondUser],
            footer: `🤖 ${botName} | Diversión y Amor`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: msg });

    } catch (error) {
        console.error('❌ Error en shipCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al intentar 
│  hacer el ship.
│
│  💡 *Posible causa:* El grupo tiene 
│  muy pocos miembros o el bot no tiene 
│  permisos para leer los participantes.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Soporte técnico`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Reportar en el Canal',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: msg });
    }
}

module.exports = shipCommand;