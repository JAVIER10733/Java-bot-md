const isAdmin = require('../lib/isAdmin');

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este comando solo se puede usar en grupos.' 
            }, { quoted: message });
        }

        // 2. Validar permisos (Dueño o Admin)
        const isOwner = message.key.fromMe;
        if (!isOwner) {
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);

            if (!isBotAdmin) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ Necesito ser administrador del grupo para poder expulsar a alguien.' 
                }, { quoted: message });
            }

            if (!isSenderAdmin) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ Lo siento, solo los administradores del grupo pueden usar este comando.' 
                }, { quoted: message });
            }
        }

        // 3. Extraer usuarios a expulsar (Menciones o Respuesta a mensaje)
        let usersToKick = [];
        
        if (mentionedJids && mentionedJids.length > 0) {
            usersToKick = mentionedJids;
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            // Soporte para mensajes efímeros (que se borran)
            usersToKick = [message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant];
        }
        
        if (usersToKick.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ Por favor, menciona al usuario o responde a su mensaje para expulsarlo.\n💡 *Ejemplo:* `.kick @usuario`'
            }, { quoted: message });
        }

        // 4. Protección Anti-Auto-Expulsión (Robusta y simplificada)
        const botNumber = sock.user.id.split(':')[0]; // Obtiene solo el número del ID del bot
        const isTryingToKickBot = usersToKick.some(userId => {
            const userNumber = userId.split(':')[0].split('@')[0];
            return userNumber === botNumber;
        });

        if (isTryingToKickBot) {
            return await sock.sendMessage(chatId, { 
                text: '🤖 ¡No puedo expulsarme a mí mismo! Eso sería un suicidio digital.' 
            }, { quoted: message });
        }

        // 5. Ejecutar la expulsión
        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");
        
        // 6. Preparar datos para el mensaje de confirmación
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        const kickerJid = message.key.participant || message.key.remoteJid;
        
        const dateStr = new Date().toLocaleString('es-EC', { 
            timeZone: 'America/Guayaquil',
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const targetsText = usersToKick.map(jid => `@${jid.split('@')[0]}`).join('\n• ');
        const kickerText = `@${kickerJid.split('@')[0]}`;

        // 7. Diseño profesional tipo "Tarjeta"
        const kickMessage = `╭━━━⊱ 👢 *EXPULSIÓN DE GRUPO* ⊱━━━╮
│
│ 👥 *Usuario${usersToKick.length > 1 ? 's' : ''} Expulsado${usersToKick.length > 1 ? 's' : ''}:*
│ • ${targetsText}
│
│ 🛡️ *Expulsado Por:* ${kickerText}
│ 📅 *Fecha:* ${dateStr}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

✅ La acción se ha completado exitosamente.`;

        // 8. Enviar mensaje con menciones reales y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: kickMessage,
            mentions: [...usersToKick, kickerJid],
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
        console.error('❌ Error en kickCommand:', error);
        
        // Manejo específico de errores comunes de WhatsApp
        if (error.message?.includes('403') || error.message?.includes('not-authorized')) {
            await sock.sendMessage(chatId, { 
                text: '❌ No tengo permisos para expulsar a este usuario (quizás es el creador del grupo o tiene un rol superior).' 
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: '❌ Ocurrió un error al intentar expulsar al usuario. Inténtalo de nuevo.' 
            }, { quoted: message });
        }
    }
}

module.exports = kickCommand;