const { handleGoodbye } = require('../lib/welcome');
const { isGoodByeOn, getGoodbye } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const fetch = require('node-fetch');

/**
 * Comando principal para configurar el mensaje de despedida (.goodbye)
 */
async function goodbyeCommand(sock, chatId, message, match) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este comando solo se puede usar en grupos.' 
            }, { quoted: message });
        }

        // 2. Validar permisos de administrador
        const senderId = message.key.participant || message.key.remoteJid;
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
        
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Necesito ser  chucha para ser *administrador* para configurar las despedidas.' 
            }, { quoted: message });
        }

        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Solo los *administradores del grupo* pueden usar este comando.' 
            }, { quoted: message });
        }

        // 3. Extraer argumentos
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const matchText = text.split(' ').slice(1).join(' ').trim();

        // 4. Mostrar menú de ayuda si no hay argumentos
        if (!matchText) {
            const botName = global.botname || 'Java Bot MD';
            const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
            
            const helpMessage = `╭━━━⊱ 👋 *MENSAJE DE DESPEDIDA* ⊱━━━╮
│
│  Configura un mensaje automático 
│  cuando un miembro abandone el grupo.
│
│  ⚙️ *Variables disponibles:*
│  • {user}  → Mención del usuario
│  • {group} → Nombre del grupo
│
│  💡 *Ejemplos de uso:*
│  • *.goodbye on*
│  • *.goodbye off*
│  • *.goodbye* ¡Hasta luego {user}! 👋
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Bienvenida y Despedida`,
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

        // 5. Procesar la configuración
        await handleGoodbye(sock, chatId, message, matchText);

    } catch (error) {
        console.error('❌ Error en goodbyeCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al configurar la despedida. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

/**
 * Maneja el evento automático cuando un usuario abandona el grupo.
 */
async function handleLeaveEvent(sock, id, participants) {
    try {
        // 1. Verificar si la despedida está activada
        const isGoodbyeEnabled = await isGoodByeOn(id);
        if (!isGoodbyeEnabled) return;

        const customMessage = await getGoodbye(id);
        const groupMetadata = await sock.groupMetadata(id);
        const groupName = groupMetadata.subject || 'este grupo';

        for (const participant of participants) {
            try {
                // 2. Normalizar el ID del participante
                const participantString = typeof participant === 'string' ? participant : (participant.id || participant.toString());
                const user = participantString.split('@')[0];
                
                // 3. Obtener el nombre de visualización (más rápido y fiable desde los metadatos)
                let displayName = user;
                try {
                    const userParticipant = groupMetadata.participants.find(p => p.id === participantString);
                    if (userParticipant && userParticipant.name) {
                        displayName = userParticipant.name;
                    }
                } catch (nameError) {
                    console.log('⚠️ No se pudo obtener el nombre, usando número de teléfono.');
                }
                
                // 4. Procesar el mensaje (personalizado o por defecto cordial)
                let finalMessage;
                if (customMessage) {
                    finalMessage = customMessage
                        .replace(/{user}/g, `@${displayName}`)
                        .replace(/{group}/g, groupName);
                } else {
                    // Mensaje por defecto profesional y cordial
                    finalMessage = `╭━━━⊱ 👋 *DES PEDIDA* ⊱━━━╮
│
│  *@${displayName}* ha abandonado el grupo.
│
│  📉 *Miembros restantes:* ${groupMetadata.participants.length - 1}
│  🏠 *Grupo:* ${groupName}
│
│  ¡Le deseamos lo mejor en su camino! 
│  Gracias por haber sido parte de nosotros.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
                }
                
                // 5. Intentar enviar con imagen de despedida
                try {
                    let profilePicUrl = 'https://i.imgur.com/2wzGhpF.jpeg'; // Avatar por defecto
                    try {
                        const profilePic = await sock.profilePictureUrl(participantString, 'image');
                        if (profilePic) profilePicUrl = profilePic;
                    } catch (profileError) {
                        // Usar imagen por defecto si no tiene foto
                    }
                    
                    // API de generación de imagen de despedida
                    const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming1?type=leave&textcolor=red&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;
                    
                    const response = await fetch(apiUrl, { timeout: 10000 });
                    if (response.ok) {
                        const imageBuffer = await response.buffer();
                        
                        await sock.sendMessage(id, {
                            image: imageBuffer,
                            caption: finalMessage,
                            mentions: [participantString]
                        });
                        continue; // Éxito, pasar al siguiente participante
                    }
                } catch (imageError) {
                    console.log('⚠️ Generación de imagen falló, usando respaldo de texto.');
                }
                
                // 6. Respaldo: Enviar solo el mensaje de texto (también usa el diseño premium si es el default)
                await sock.sendMessage(id, {
                    text: finalMessage,
                    mentions: [participantString]
                });

            } catch (error) {
                console.error('❌ Error procesando despedida de un participante:', error);
                
                // 7. Respaldo final a prueba de fallos
                try {
                    const participantString = typeof participant === 'string' ? participant : (participant.id || participant.toString());
                    const user = participantString.split('@')[0];
                    
                    const fallbackMessage = customMessage 
                        ? customMessage.replace(/{user}/g, `@${user}`).replace(/{group}/g, groupName)
                        : `👋 *@${user}* ha dejado el grupo. ¡Le deseamos lo mejor y q se valla pal carajo or mamaverga!`;
                    
                    await sock.sendMessage(id, {
                        text: fallbackMessage,
                        mentions: [participantString]
                    });
                } catch (finalError) {
                    console.error('❌ Fallo crítico en el respaldo de despedida:', finalError);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error general en handleLeaveEvent:', error);
    }
}

module.exports = { goodbyeCommand, handleLeaveEvent };