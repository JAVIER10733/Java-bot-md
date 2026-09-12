const { setAntilink, getAntilink, removeAntilink, incrementWarningCount, resetWarningCount } = require('../lib/index');
const isAdminHelper = require('../lib/isAdmin');

/**
 * Comando principal para configurar el sistema Antilink (.antilink)
 */
async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este comando solo se puede usar en grupos.' 
            }, { quoted: message });
        }

        // 2. Validar permisos (Dueño o Admin)
        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Lo siento, solo los *administradores del grupo* pueden configurar el Antilink.' 
            }, { quoted: message });
        }

        // 3. Validar que el bot sea administrador (necesario para borrar/expulsar)
        const { isBotAdmin } = await isAdminHelper(sock, chatId, senderId, message);
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Necesito ser *administrador del grupo* para poder eliminar enlaces y aplicar sanciones.' 
            }, { quoted: message });
        }

        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 4. Mostrar menú de ayuda si no hay argumentos o comando inválido
        if (!action || (action !== 'on' && action !== 'off' && action !== 'set' && action !== 'status')) {
            const helpMessage = `╭━━━⊱ 🔗 *ANTILINK* ⊱━━━╮
│
│  Protege el grupo contra enlaces
│  no deseados (WhatsApp, Telegram, Web).
│
│  ⚙️ *Comandos disponibles:*
│  • *.antilink on*      → Activar filtro (predeterminado: borrar)
│  • *.antilink off*     → Desactivar filtro
│  • *.antilink set <acción>* → Cambiar sanción
│  • *.antilink status*  → Ver estado actual
│
│  📌 *Acciones disponibles:*
│  • *delete* → Solo borra el mensaje y advierte.
│  • *warn*   → Advierte (3 advertencias = expulsión).
│  • *kick*   → Expulsa inmediatamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Seguridad avanzada`,
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

        // 5. Mostrar estado actual
        if (action === 'status') {
            const config = await getAntilink(chatId, 'on');
            const isEnabled = config?.enabled;
            const currentAction = config?.action || 'delete';
            const statusEmoji = isEnabled ? '🟢' : '🔴';
            const statusText = isEnabled ? 'ACTIVADO' : 'DESACTIVADO';
            
            const statusMessage = `╭━━━⊱ 📊 *ESTADO DEL SISTEMA* ⊱━━━╮
│
│  🔗 *Antilink:* ${statusEmoji} *${statusText}*
│  🔨 *Sanción actual:* ${currentAction.toUpperCase()}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: statusMessage,
                footer: `🤖 ${botName} | Seguridad avanzada`,
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

        // 6. Activar el sistema
        if (action === 'on') {
            const existingConfig = await getAntilink(chatId, 'on');
            if (existingConfig?.enabled) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ El sistema *Antilink* ya está activado en este grupo.' 
                }, { quoted: message });
            }
            await setAntilink(chatId, 'on', 'delete');
            return await sock.sendMessage(chatId, { 
                text: '✅ *Antilink activado correctamente.*\n\n💡 Por defecto, los enlaces serán *eliminados*. Usa *.antilink set <acción>* para cambiar la sanción.' 
            }, { quoted: message });
        }

        // 7. Desactivar el sistema
        if (action === 'off') {
            const config = await getAntilink(chatId, 'on');
            if (!config?.enabled) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ El sistema *Antilink* ya está desactivado en este grupo.' 
                }, { quoted: message });
            }
            await removeAntilink(chatId, 'on');
            return await sock.sendMessage(chatId, { 
                text: '🔓 *Antilink desactivado correctamente.*\nEl filtro de enlaces ya no está en vigor.' 
            }, { quoted: message });
        }

        // 8. Configurar la acción (set)
        if (action === 'set') {
            const sanction = args[1]?.toLowerCase();
            if (!sanction || !['delete', 'kick', 'warn'].includes(sanction)) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ *Acción no válida.*\n\nPor favor, elige una de estas opciones:\n• `delete`\n• `kick`\n• `warn`' 
                }, { quoted: message });
            }
            
            await setAntilink(chatId, 'on', sanction);
            const sanctionEmojis = { 'delete': '🗑️', 'kick': '👢', 'warn': '⚠️' };
            const sanctionNames = { 'delete': 'Eliminar mensaje', 'kick': 'Expulsar usuario', 'warn': 'Sistema de advertencias (3 strikes)' };

            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ⚙️ *CONFIGURACIÓN ACTUALIZADA* ⊱━━━╮
│
│  🔗 *Estado:* Activado
│  🔨 *Sanción:* ${sanctionEmojis[sanction]} ${sanctionNames[sanction]}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

✅ Los cambios se aplicarán de inmediato.` 
            }, { quoted: message });
        }

    } catch (error) {
        console.error('❌ Error en handleAntilinkCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al procesar la configuración. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

/**
 * Detector automático de enlaces en los mensajes del grupo
 */
async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        // Validaciones iniciales rápidas
        if (!chatId.endsWith('@g.us')) return;
        if (message.key.fromMe) return;
        if (!userMessage || typeof userMessage !== 'string') return;

        // Verificar si el sistema está activado
        const config = await getAntilink(chatId, 'on');
        if (!config?.enabled) return;

        // Patrones de enlaces (WhatsApp, Telegram y URLs generales)
        const linkPatterns = {
            whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
            whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
            telegram: /t\.me\/[A-Za-z0-9_]+/i,
            allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
        };

        // Verificar si el mensaje contiene algún enlace
        const hasLink = linkPatterns.whatsappGroup.test(userMessage) || 
                        linkPatterns.whatsappChannel.test(userMessage) || 
                        linkPatterns.telegram.test(userMessage) || 
                        linkPatterns.allLinks.test(userMessage);

        if (!hasLink) return;

        // --- ACCIÓN DE MODERACIÓN ---

        // 1. Verificar permisos del bot
        const groupMetadata = await sock.groupMetadata(chatId);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = groupMetadata.participants.find(p => p.id === botId);
        
        if (!botParticipant?.admin) {
            console.warn('⚠️ Antilink: El bot no es admin, no se puede tomar acción.');
            return;
        }

        // 2. Verificar si el infractor es admin o el creador del grupo (Protección)
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        if (senderParticipant?.admin || senderParticipant?.superadmin) {
            console.log('✅ Antilink: Administrador detectado, acción omitida.');
            return;
        }

        // 3. Eliminar el mensaje con enlace inmediatamente
        try {
            await sock.sendMessage(chatId, { 
                delete: { 
                    remoteJid: chatId, 
                    fromMe: false, 
                    id: message.key.id, 
                    participant: message.key.participant || senderId 
                }
            });
        } catch (err) {
            console.error('❌ Error al eliminar el mensaje con enlace:', err);
            return; // Si no puede borrar, no tiene sentido continuar
        }

        const userMention = `@${senderId.split('@')[0]}`;
        const sanction = config.action || 'delete';

        // 4. Aplicar la sanción configurada
        switch (sanction) {
            case 'delete':
                await sock.sendMessage(chatId, {
                    text: `🚫 *${userMention}*, no está permitido enviar enlaces en este grupo.\n\n📝 Tu mensaje ha sido eliminado.`,
                    mentions: [senderId]
                });
                break;

            case 'kick':
                try {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await sock.sendMessage(chatId, {
                        text: `👢 *${userMention}* ha sido expulsado por enviar enlaces.\n\n🛡️ La seguridad del grupo es primero.`,
                        mentions: [senderId]
                    });
                } catch (error) {
                    console.error('❌ Error al expulsar al usuario por enlace:', error);
                }
                break;

            case 'warn':
                try {
                    const warningCount = await incrementWarningCount(chatId, senderId);
                    
                    if (warningCount >= 3) {
                        // Expulsar al llegar a 3 advertencias
                        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                        await resetWarningCount(chatId, senderId); // Resetear por si vuelve a entrar
                        await sock.sendMessage(chatId, {
                            text: `👢 *${userMention}* ha sido expulsado tras acumular *3 advertencias* por enviar enlaces.\n\n🛡️ Grupo protegido por ${global.botname || 'Java Bot MD'}.`,
                            mentions: [senderId]
                        });
                    } else {
                        // Solo advertir
                        await sock.sendMessage(chatId, {
                            text: `⚠️ *Advertencia ${warningCount}/3* para *${userMention}*.\n\n📝 Tu mensaje fue eliminado por contener un enlace. A la tercera advertencia serás expulsado automáticamente.`,
                            mentions: [senderId]
                        });
                    }
                } catch (error) {
                    console.error('❌ Error en el sistema de advertencias de Antilink:', error);
                    // Fallback: si falla el contador, al menos avisamos
                    await sock.sendMessage(chatId, {
                        text: `🚫 *${userMention}*, se ha detectado un enlace y tu mensaje fue eliminado.`,
                        mentions: [senderId]
                    });
                }
                break;
        }
    } catch (error) {
        console.error('❌ Error crítico en handleLinkDetection:', error);
    }
}

module.exports = {
    handleAntilinkCommand,
    handleLinkDetection
};