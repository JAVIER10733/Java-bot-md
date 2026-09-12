const { handleWelcome } = require('../lib/welcome');
const { isWelcomeOn, getWelcome } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const fetch = require('node-fetch');

/**
 * Comando principal para configurar el mensaje de bienvenida (.welcome)
 */
async function welcomeCommand(sock, chatId, message, match) {
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
                text: '❌ Necesito ser *administrador* para configurar las bienvenidas.' 
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
            
            const helpMessage = `╭━━━⊱ 👋 *MENSAJE DE BIENVENIDA* ⊱━━━╮
│
│  Configura un mensaje automático 
│  cuando un nuevo miembro se una al grupo.
│
│  ⚙️ *Variables disponibles:*
│  • {user}  → Mención del usuario
│  • {group} → Nombre del grupo
│  • {desc}  → Descripción del grupo
│
│  💡 *Ejemplos de uso:*
│  • *.welcome on*
│  • *.welcome off*
│  • *.welcome* ¡Bienvenido {user} a {group}! 🎉
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
        await handleWelcome(sock, chatId, message, matchText);

    } catch (error) {
        console.error('❌ Error en welcomeCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al configurar la bienvenida. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

/**
 * Maneja el evento automático cuando un usuario se une al grupo.
 */
async function handleJoinEvent(sock, id, participants) {
    try {
        // 1. Verificar si la bienvenida está activada
        const isWelcomeEnabled = await isWelcomeOn(id);
        if (!isWelcomeEnabled) return;

        const customMessage = await getWelcome(id);
        const groupMetadata = await sock.groupMetadata(id);
        const groupName = groupMetadata.subject || 'este grupo';
        const groupDesc = groupMetadata.desc || 'Sin descripción disponible.';

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
                
                // 4. Procesar el mensaje (personalizado o por defecto)
                let finalMessage;
                if (customMessage) {
                    finalMessage = customMessage
                        .replace(/{user}/g, `@${displayName}`)
                        .replace(/{group}/g, groupName)
                        .replace(/{desc}/g, groupDesc)
                        .replace(/{description}/g, groupDesc); // Soporte para ambas variantes
                } else {
                    // Mensaje por defecto profesional y cálido
                    const timeStr = new Date().toLocaleString('es-EC', { 
                        timeZone: 'America/Guayaquil',
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });

                    finalMessage = `╭━━━⊱ 👋 *¡BIENVENIDO/A!* ⊱━━━╮
│
│  🎉 Hola *@${displayName}*, nos alegra 
│  que te unas a nuestra comunidad.
│
│  👥 *Miembros:* ${groupMetadata.participants.length}
│  📅 *Fecha:* ${timeStr}
│
│  📜 *Normas del grupo:*
│  _${groupDesc.length > 100 ? groupDesc.substring(0, 100) + '...' : groupDesc}_
│
│  ¡Disfruta tu estancia y sé respetuoso/a!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
                }
                
                // 5. Intentar enviar con imagen de bienvenida
                try {
                    let profilePicUrl = 'https://i.imgur.com/2wzGhpF.jpeg'; // Avatar por defecto
                    try {
                        const profilePic = await sock.profilePictureUrl(participantString, 'image');
                        if (profilePic) profilePicUrl = profilePic;
                    } catch (profileError) {
                        // Usar imagen por defecto si no tiene foto
                    }
                    
                    // API de generación de imagen de bienvenida
                    const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming3?type=join&textcolor=green&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;
                    
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
                
                // 6. Respaldo: Enviar solo el mensaje de texto
                await sock.sendMessage(id, {
                    text: finalMessage,
                    mentions: [participantString]
                });

            } catch (error) {
                console.error('❌ Error procesando bienvenida de un participante:', error);
                
                // 7. Respaldo final a prueba de fallos
                try {
                    const participantString = typeof participant === 'string' ? participant : (participant.id || participant.toString());
                    const user = participantString.split('@')[0];
                    
                    const fallbackMessage = customMessage 
                        ? customMessage.replace(/{user}/g, `@${user}`).replace(/{group}/g, groupName).replace(/{desc}/g, groupDesc).replace(/{description}/g, groupDesc)
                        : `👋 ¡Bienvenido/a *@${user}* a *${groupName}*! 🎉`;
                    
                    await sock.sendMessage(id, {
                        text: fallbackMessage,
                        mentions: [participantString]
                    });
                } catch (finalError) {
                    console.error('❌ Fallo crítico en el respaldo de bienvenida:', finalError);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error general en handleJoinEvent:', error);
    }
}

module.exports = { welcomeCommand, handleJoinEvent };