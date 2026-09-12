const { isAdmin } = require('../lib/isAdmin');

/**
 * Comando manual para ascender a uno o más usuarios a administradores.
 */
async function promoteCommand(sock, chatId, mentionedJids, message) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este comando solo se puede usar en grupos.' 
            }, { quoted: message });
        }

        // 2. Validar que el bot sea administrador
        const botJid = sock.user.id;
        const isBotAdmin = await isAdmin(sock, chatId, botJid);
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Necesito ser administrador del grupo para poder ascender a alguien.' 
            }, { quoted: message });
        }

        // 3. Extraer usuarios a ascender (menciones o respuesta a mensaje)
        let usersToPromote = [];
        
        if (mentionedJids && mentionedJids.length > 0) {
            usersToPromote = mentionedJids;
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            usersToPromote = [message.message.extendedTextMessage.contextInfo.participant];
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            // Soporte para mensajes efímeros (mensajes que se borran)
            usersToPromote = [message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant];
        }

        if (usersToPromote.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ Por favor, menciona al usuario o responde a su mensaje para ascenderlo.\n💡 *Ejemplo:* `.promote @usuario`' 
            }, { quoted: message });
        }

        // 4. Ejecutar el ascenso
        await sock.groupParticipantsUpdate(chatId, usersToPromote, "promote");

        // 5. Preparar datos para el mensaje
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        const promoterJid = message.key.participant || message.key.remoteJid;
        
        // Zona horaria de Ecuador (Los Ríos)
        const dateStr = new Date().toLocaleString('es-EC', { 
            timeZone: 'America/Guayaquil',
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const targetsText = usersToPromote.map(jid => `@${jid.split('@')[0]}`).join('\n• ');
        const promoterText = `@${promoterJid.split('@')[0]}`;

        // 6. Diseño profesional tipo "Tarjeta"
        const promotionMessage = `╭━━━⊱ 👑 *ASCENSO DE GRUPO* ⊱━━━╮
│
│ 👥 *Usuario${usersToPromote.length > 1 ? 's' : ''} Ascendido${usersToPromote.length > 1 ? 's' : ''}:*
│ • ${targetsText}
│
│ 🛡️ *Ascendido Por:* ${promoterText}
│ 📅 *Fecha:* ${dateStr}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

✅ Los permisos de administrador han sido otorgados.`;

        // 7. Enviar mensaje con menciones reales y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: promotionMessage,
            mentions: [...usersToPromote, promoterJid],
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
        console.error('❌ Error en promoteCommand:', error);
        
        // Manejo específico de errores comunes de WhatsApp
        if (error.message?.includes('403') || error.message?.includes('not-authorized')) {
            await sock.sendMessage(chatId, { 
                text: '❌ No tengo permisos para ascender a este usuario (quizás ya es admin o el creador del grupo).' 
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: '❌ Ocurrió un error al intentar ascender al usuario. Inténtalo de nuevo.' 
            }, { quoted: message });
        }
    }
}

/**
 * Detector automático de ascensos (cuando alguien asciende a otro por la app de WhatsApp).
 */
async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) return;

        const botName = global.botname || 'Java Bot MD';
        const dateStr = new Date().toLocaleString('es-EC', { 
            timeZone: 'America/Guayaquil',
            hour: '2-digit', minute: '2-digit'
        });

        // Formatear menciones de los ascendidos
        const promotedJids = participants.map(p => typeof p === 'string' ? p : (p.id || p.toString()));
        const promotedText = promotedJids.map(jid => `@${jid.split('@')[0]}`).join('\n• ');

        let promotedBy = 'Sistema';
        let mentionList = [...promotedJids];

        if (author && author.length > 0) {
            const authorJid = typeof author === 'string' ? author : (author.id || author.toString());
            promotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        }

        // Diseño limpio y elegante para eventos automáticos (sin botón para no saturar el grupo)
        const autoPromotionMessage = `╭━━━⊱ 👑 *NUEVO ADMINISTRADOR* ⊱━━━╮
│
│ 👥 *Ascendido${participants.length > 1 ? 's' : ''}:*
│ • ${promotedText}
│
│ 🛡️ *Por:* ${promotedBy}
│ 🕒 *Hora:* ${dateStr}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🤖 Notificación automática de *${botName}*`;

        await sock.sendMessage(groupId, {
            text: autoPromotionMessage,
            mentions: mentionList
        });

    } catch (error) {
        console.error('❌ Error en handlePromotionEvent:', error);
    }
}

module.exports = { promoteCommand, handlePromotionEvent };