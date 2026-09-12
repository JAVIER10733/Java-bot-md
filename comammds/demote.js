const isAdmin = require('../lib/isAdmin');

/**
 * Comando manual para remover el rol de administrador a uno o más usuarios.
 */
async function demoteCommand(sock, chatId, mentionedJids, message) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este comando solo se puede usar en grupos.' 
            }, { quoted: message });
        }

        const senderId = message.key.participant || message.key.remoteJid;
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 2. Verificar permisos de administrador
        const adminStatus = await isAdmin(sock, chatId, senderId, message);
        
        if (!adminStatus.isBotAdmin) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Necesito ser *administrador del grupo* para poder realizar esta acción.' 
            }, { quoted: message });
        }

        if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Lo siento, solo los *administradores del grupo* pueden usar este comando.' 
            }, { quoted: message });
        }

        // 3. Extraer usuarios a descender (Menciones, Respuesta o Mensaje Efímero)
        let usersToDemote = [];
        
        if (mentionedJids && mentionedJids.length > 0) {
            usersToDemote = mentionedJids;
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            usersToDemote = [message.message.extendedTextMessage.contextInfo.participant];
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            // Soporte para respuestas a mensajes efímeros
            usersToDemote = [message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant];
        }
        
        if (usersToDemote.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ Por favor, menciona al usuario o responde a su mensaje para removerle el cargo.\n💡 *Ejemplo:* `.demote @usuario`' 
            }, { quoted: message });
        }

        // 4. Protección: Evitar que el bot se descendiera a sí mismo
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isTryingToDemoteBot = usersToDemote.some(userId => {
            const userNumber = userId.split(':')[0].split('@')[0];
            const botNum = botNumber.split(':')[0].split('@')[0];
            return userNumber === botNum;
        });

        if (isTryingToDemoteBot) {
            return await sock.sendMessage(chatId, { 
                text: '🤖 ¡No puedo removerme el cargo a mí mismo! Eso sería un suicidio administrativo.' 
            }, { quoted: message });
        }

        // 5. Ejecutar el descenso
        await sock.groupParticipantsUpdate(chatId, usersToDemote, "demote");
        
        // 6. Preparar datos para el mensaje de confirmación
        const demoterJid = message.key.participant || message.key.remoteJid;
        const dateStr = new Date().toLocaleString('es-EC', { 
            timeZone: 'America/Guayaquil',
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const targetsText = usersToDemote.map(jid => `@${jid.split('@')[0]}`).join('\n• ');
        const demoterText = `@${demoterJid.split('@')[0]}`;

        // 7. Diseño profesional tipo "Tarjeta"
        const demotionMessage = `╭━━━⊱ 👑 *DESCENSO DE GRUPO* ⊱━━━╮
│
│  👤 *Usuario${usersToDemote.length > 1 ? 's' : ''} Descendido${usersToDemote.length > 1 ? 's' : ''}:*
│  • ${targetsText}
│
│  🛡️ *Descendido Por:* ${demoterText}
│  📅 *Fecha:* ${dateStr}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

✅ Los permisos de administrador han sido removidos exitosamente.`;

        // 8. Enviar mensaje con menciones reales y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: demotionMessage,
            mentions: [...usersToDemote, demoterJid],
            footer: `🤖 ${botName} | Administración segura`,
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
        console.error('❌ Error en demoteCommand:', error);
        
        // Manejo específico de errores comunes de WhatsApp
        if (error.message?.includes('403') || error.message?.includes('not-authorized')) {
            await sock.sendMessage(chatId, { 
                text: '❌ No tengo permisos para realizar esta acción (quizás el usuario es el creador del grupo o ya es miembro normal).' 
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: '❌ Ocurrió un error al intentar remover el cargo. Inténtalo de nuevo.' 
            }, { quoted: message });
        }
    }
}

/**
 * Detector automático de descensos (cuando alguien remueve el cargo a otro por la app de WhatsApp).
 */
async function handleDemotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) return;

        const botName = global.botname || 'Java Bot MD';
        const dateStr = new Date().toLocaleString('es-EC', { 
            timeZone: 'America/Guayaquil',
            hour: '2-digit', minute: '2-digit'
        });

        // Formatear menciones de los descendidos
        const demotedJids = participants.map(p => typeof p === 'string' ? p : (p.id || p.toString()));
        const demotedText = demotedJids.map(jid => `@${jid.split('@')[0]}`).join('\n• ');

        let demotedBy = 'Sistema';
        let mentionList = [...demotedJids];

        if (author && author.length > 0) {
            const authorJid = typeof author === 'string' ? author : (author.id || author.toString());
            demotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        }

        // Diseño limpio y elegante para eventos automáticos (sin botón para no saturar el grupo)
        const autoDemotionMessage = `╭━━━⊱ 👑 *CAMBIO DE ROL* ⊱━━━╮
│
│  👤 *Descendido${participants.length > 1 ? 's' : ''}:*
│  • ${demotedText}
│
│  🛡️ *Por:* ${demotedBy}
│  🕒 *Hora:* ${dateStr}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🤖 Notificación automática de *${botName}*`;

        await sock.sendMessage(groupId, {
            text: autoDemotionMessage,
            mentions: mentionList
        });

    } catch (error) {
        console.error('❌ Error en handleDemotionEvent:', error);
    }
}

module.exports = { demoteCommand, handleDemotionEvent };