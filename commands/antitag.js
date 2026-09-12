const { setAntitag, getAntitag, removeAntitag, incrementWarningCount, resetWarningCount } = require('../lib/index');
const isAdminHelper = require('../lib/isAdmin');

/**
 * Comando principal para configurar el sistema AntiTag (.antitag)
 */
async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
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
                text: '❌ Lo siento, solo los *administradores del grupo* pueden configurar el AntiTag.' 
            }, { quoted: message });
        }

        // 3. Validar que el bot sea administrador (necesario para borrar/expulsar)
        const { isBotAdmin } = await isAdminHelper(sock, chatId, senderId, message);
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Necesito ser *administrador del grupo* para poder eliminar mensajes masivos y aplicar sanciones.' 
            }, { quoted: message });
        }

        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 4. Mostrar menú de ayuda si no hay argumentos o comando inválido
        if (!action || (action !== 'on' && action !== 'off' && action !== 'set' && action !== 'status')) {
            const helpMessage = `╭━━━⊱ 🏷️ *ANTITAG* ⊱━━━╮
│
│  Protege al grupo contra menciones
│  masivas (.tagall) que generan spam.
│
│  ⚙️ *Comandos disponibles:*
│  • *.antitag on*      → Activar filtro (predeterminado: borrar)
│  • *.antitag off*     → Desactivar filtro
│  • *.antitag set <acción>* → Cambiar sanción
│  • *.antitag status*  → Ver estado actual
│
│  📌 *Acciones disponibles:*
│  • *delete* → Borra el mensaje y advierte.
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
            const config = await getAntitag(chatId, 'on');
            const isEnabled = config?.enabled;
            const currentAction = config?.action || 'delete';
            const statusEmoji = isEnabled ? '🟢' : '🔴';
            const statusText = isEnabled ? 'ACTIVADO' : 'DESACTIVADO';
            
            const statusMessage = `╭━━━⊱ 📊 *ESTADO DEL SISTEMA* ⊱━━━╮
│
│  🏷️ *AntiTag:* ${statusEmoji} *${statusText}*
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
            const existingConfig = await getAntitag(chatId, 'on');
            if (existingConfig?.enabled) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ El sistema *AntiTag* ya está activado en este grupo.' 
                }, { quoted: message });
            }
            await setAntitag(chatId, 'on', 'delete');
            return await sock.sendMessage(chatId, { 
                text: '✅ *AntiTag activado correctamente.*\n\n💡 Por defecto, los mensajes masivos serán *eliminados*. Usa *.antitag set <acción>* para cambiar la sanción.' 
            }, { quoted: message });
        }

        // 7. Desactivar el sistema
        if (action === 'off') {
            const config = await getAntitag(chatId, 'on');
            if (!config?.enabled) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ El sistema *AntiTag* ya está desactivado en este grupo.' 
                }, { quoted: message });
            }
            await removeAntitag(chatId, 'on');
            return await sock.sendMessage(chatId, { 
                text: '🔓 *AntiTag desactivado correctamente.*\nEl filtro de menciones masivas ya no está en vigor.' 
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
            
            await setAntitag(chatId, 'on', sanction);
            const sanctionEmojis = { 'delete': '🗑️', 'kick': '👢', 'warn': '⚠️' };
            const sanctionNames = { 'delete': 'Eliminar mensaje', 'kick': 'Expulsar usuario', 'warn': 'Sistema de advertencias (3 strikes)' };

            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ⚙️ *CONFIGURACIÓN ACTUALIZADA* ⊱━━━╮
│
│  🏷️ *Estado:* Activado
│  🔨 *Sanción:* ${sanctionEmojis[sanction]} ${sanctionNames[sanction]}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

✅ Los cambios se aplicarán de inmediato.` 
            }, { quoted: message });
        }

    } catch (error) {
        console.error('❌ Error en handleAntitagCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al procesar la configuración. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

/**
 * Detector automático de menciones masivas (tagall) en el grupo
 */
async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        // Validaciones iniciales rápidas
        if (!chatId.endsWith('@g.us')) return;
        if (message.key.fromMe) return;

        // Verificar si el sistema está activado
        const config = await getAntitag(chatId, 'on');
        if (!config?.enabled) return;

        // 1. Extraer menciones de forma robusta
        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        // Si no hay menciones explícitas, no es un tagall
        if (mentionedJids.length === 0) return;

        // 2. Obtener metadatos del grupo para calcular el umbral y verificar permisos
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = participants.find(p => p.id === botId);
        const senderParticipant = participants.find(p => p.id === senderId);

        // 3. Protección: Si el bot no es admin, no puede hacer nada
        if (!botParticipant?.admin) {
            console.warn('⚠️ AntiTag: El bot no es admin, no se puede tomar acción.');
            return;
        }

        // 4. Protección: Si el que hace el tagall es admin o creador, se ignora
        if (senderParticipant?.admin || senderParticipant?.superadmin) {
            console.log('✅ AntiTag: Administrador detectado, acción omitida.');
            return;
        }

        // 5. Lógica de detección: Es tagall si menciona a >= 5 personas O >= 50% del grupo
        const mentionThreshold = Math.max(5, Math.ceil(participants.length * 0.5));
        
        if (mentionedJids.length >= mentionThreshold) {
            // 6. Eliminar el mensaje ofensivo inmediatamente
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
                console.error('❌ Error al eliminar el mensaje de tagall:', err);
                return; // Si no puede borrar, no tiene sentido continuar
            }

            const userMention = `@${senderId.split('@')[0]}`;
            const sanction = config.action || 'delete';

            // 7. Aplicar la sanción configurada
            switch (sanction) {
                case 'delete':
                    await sock.sendMessage(chatId, {
                        text: `🚫 *${userMention}*, no está permitido hacer menciones masivas (.tagall) en este grupo.\n\n📝 Tu mensaje ha sido eliminado.`,
                        mentions: [senderId]
                    });
                    break;

                case 'kick':
                    try {
                        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                        await sock.sendMessage(chatId, {
                            text: `👢 *${userMention}* ha sido expulsado por realizar menciones masivas (spam).\n\n🛡️ La seguridad del grupo es primero.`,
                            mentions: [senderId]
                        });
                    } catch (error) {
                        console.error('❌ Error al expulsar al usuario por tagall:', error);
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
                                text: `👢 *${userMention}* ha sido expulsado tras acumular *3 advertencias* por menciones masivas.\n\n🛡️ Grupo protegido por ${global.botname || 'Java Bot MD'}.`,
                                mentions: [senderId]
                            });
                        } else {
                            // Solo advertir
                            await sock.sendMessage(chatId, {
                                text: `⚠️ *Advertencia ${warningCount}/3* para *${userMention}*.\n\n📝 Tu mensaje fue eliminado por contener menciones masivas. A la tercera advertencia serás expulsado automáticamente.`,
                                mentions: [senderId]
                            });
                        }
                    } catch (error) {
                        console.error('❌ Error en el sistema de advertencias de AntiTag:', error);
                        // Fallback: si falla el contador, al menos avisamos
                        await sock.sendMessage(chatId, {
                            text: `🚫 *${userMention}*, se ha detectado un tagall y tu mensaje fue eliminado.`,
                            mentions: [senderId]
                        });
                    }
                    break;
            }
        }
    } catch (error) {
        console.error('❌ Error crítico en handleTagDetection:', error);
    }
}

module.exports = {
    handleAntitagCommand,
    handleTagDetection
};