const { isJidGroup } = require('@whiskeysockets/baileys');
const { getAntilink, setAntilink, removeAntilink, incrementWarningCount, resetWarningCount, isSudo } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
const WARN_COUNT = 3;

/**
 * Verifica si una cadena contiene una URL (incluye enlaces de WhatsApp, http, https, www, etc.)
 */
function containsURL(str) {
    const urlRegex = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    return urlRegex.test(str);
}

/**
 * Comando principal para configurar el sistema (.antilink)
 */
async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: CHANNEL_LINK,
                        merchant_url: CHANNEL_LINK
                    })
                }],
                headerType: 1
            }, { quoted: message });
        }

        // 2. Validar permisos de administrador
        const { isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
        
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *PERMISOS INSUFICIENTES* ⊱━━━╮
│
│  Necesito ser *administrador* para 
│  gestionar el sistema Anti-Enlaces.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: CHANNEL_LINK,
                        merchant_url: CHANNEL_LINK
                    })
                }],
                headerType: 1
            }, { quoted: message });
        }

        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ACCESO DENEGADO* ⊱━━━╮
│
│  Solo los *administradores* pueden 
│  configurar este sistema.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: CHANNEL_LINK,
                        merchant_url: CHANNEL_LINK
                    })
                }],
                headerType: 1
            }, { quoted: message });
        }

        const args = userMessage.split(' ').slice(1);
        const action = args[0]?.toLowerCase();

        // 3. Mostrar menú de ayuda si no hay argumentos
        if (!action) {
            const helpMessage = `╭━━━⊱ 🔗 *SISTEMA ANTI-LINK* ⊱━━━╮
│
│  Protege tu grupo contra el spam 
│  de enlaces no autorizados.
│
│  ⚙️ *Comandos disponibles:*
│  • *.antilink on*      → Activar filtro
│  • *.antilink off*     → Desactivar filtro
│  • *.antilink set <acción>* → Cambiar sanción
│
│  📌 *Acciones disponibles:*
│  • *delete* → Solo borra el mensaje.
│  • *warn*   → Advierte (3 strikes = expulsión).
│  • *kick*   → Expulsa inmediatamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${BOT_NAME} | Moderación`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: CHANNEL_LINK,
                        merchant_url: CHANNEL_LINK
                    })
                }],
                headerType: 1
            }, { quoted: message });
        }

        // 4. Activar el sistema
        if (action === 'on') {
            const existingConfig = await getAntilink(chatId, 'on');
            if (existingConfig?.enabled) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ El sistema *Anti-Link* ya está activado en este grupo.' 
                }, { quoted: message });
            }
            await setAntilink(chatId, 'on', 'delete');
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ✅ *SISTEMA ACTIVADO* ⊱━━━╮
│
│  🔗 *Estado:* Activado
│  🔨 *Sanción por defecto:* Eliminar
│
│  💡 Usa *.antilink set <acción>* 
│  para cambiar el tipo de sanción.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: CHANNEL_LINK,
                        merchant_url: CHANNEL_LINK
                    })
                }],
                headerType: 1
            }, { quoted: message });
        }

        // 5. Desactivar el sistema
        if (action === 'off') {
            const config = await getAntilink(chatId, 'on');
            if (!config?.enabled) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ El sistema *Anti-Link* ya está desactivado.' 
                }, { quoted: message });
            }
            await removeAntilink(chatId);
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ 🔓 *SISTEMA DESACTIVADO* ⊱━━━╮
│
│  El filtro de enlaces ha sido 
│  desactivado exitosamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: CHANNEL_LINK,
                        merchant_url: CHANNEL_LINK
                    })
                }],
                headerType: 1
            }, { quoted: message });
        }

        // 6. Configurar la acción (set)
        if (action === 'set') {
            const sanction = args[1]?.toLowerCase();
            
            if (!sanction || !['delete', 'kick', 'warn'].includes(sanction)) {
                return await sock.sendMessage(chatId, { 
                    text: `╭━━━⊱ ❌ *ACCIÓN NO VÁLIDA* ⊱━━━╮
│
│  Por favor, elige una de estas opciones:
│  • *delete*
│  • *kick*
│  • *warn*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${BOT_NAME} | Moderación`,
                    buttons: [{
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📢 Únete a mi Canal Oficial',
                            url: CHANNEL_LINK,
                            merchant_url: CHANNEL_LINK
                        })
                    }],
                    headerType: 1
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
│  ✅ Los cambios se aplican de inmediato.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: CHANNEL_LINK,
                        merchant_url: CHANNEL_LINK
                    })
                }],
                headerType: 1
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
async function Antilink(msg, sock) {
    try {
        const jid = msg.key.remoteJid;
        if (!isJidGroup(jid)) return;

        const SenderMessage = msg.message?.conversation || 
                              msg.message?.extendedTextMessage?.text || 
                              msg.message?.imageMessage?.caption || 
                              msg.message?.videoMessage?.caption || '';
                              
        if (!SenderMessage || typeof SenderMessage !== 'string') return;

        const sender = msg.key.participant || msg.key.remoteJid;
        if (!sender) return;
        
        // 1. Omitir si el remitente es administrador del grupo o Sudo
        try {
            const { isSenderAdmin } = await isAdmin(sock, jid, sender, msg);
            if (isSenderAdmin) return;
        } catch (_) {}
        
        const senderIsSudo = await isSudo(sender);
        if (senderIsSudo) return;

        // 2. Verificar si contiene URL
        if (!containsURL(SenderMessage.trim())) return;
        
        // 3. Verificar configuración
        const antilinkConfig = await getAntilink(jid, 'on');
        if (!antilinkConfig?.enabled) return;

        const action = antilinkConfig.action || 'delete';

        // 4. Verificar permisos del bot antes de actuar
        const groupMetadata = await sock.groupMetadata(jid);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = groupMetadata.participants.find(p => p.id === botId);
        
        if (!botParticipant?.admin) {
            console.warn('⚠️ AntiLink: El bot no es admin, no se puede tomar acción.');
            return;
        }

        // 5. Eliminar el mensaje ofensivo inmediatamente
        try {
            await sock.sendMessage(jid, { delete: msg.key });
        } catch (err) {
            console.error('❌ Error al eliminar el mensaje de enlace:', err);
            return;
        }

        const userMention = `@${sender.split('@')[0]}`;

        // 6. Aplicar la sanción configurada con diseño premium
        switch (action) {
            case 'delete':
                await sock.sendMessage(jid, {
                    text: `╭━━━⊱ 🚫 *ENLACE DETECTADO* ⊱━━━╮
│
│  👤 *Usuario:* ${userMention}
│  📝 *Acción:* Mensaje eliminado.
│
│  ⚠️ No está permitido enviar 
│  enlaces en este grupo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    mentions: [sender]
                });
                break;

            case 'kick':
                try {
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                    await sock.sendMessage(jid, {
                        text: `╭━━━⊱ 👢 *USUARIO EXPULSADO* ⊱━━━╮
│
│  👤 *Expulsado:* ${userMention}
│  🚫 *Motivo:* Envío de enlaces 
│  no autorizados (Expulsión directa).
│
│  🛡️ La seguridad del grupo es 
│  nuestra prioridad.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                        mentions: [sender]
                    });
                } catch (error) {
                    console.error('❌ Error al expulsar al usuario por enlace:', error);
                }
                break;

            case 'warn':
                try {
                    const warningCount = await incrementWarningCount(jid, sender);
                    
                    if (warningCount >= WARN_COUNT) {
                        await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                        await resetWarningCount(jid, sender); // Resetear por si vuelve a entrar
                        await sock.sendMessage(jid, {
                            text: `╭━━━⊱ 👢 *EXPULSIÓN AUTOMÁTICA* ⊱━━━╮
│
│  👤 *Expulsado:* ${userMention}
│  ⚠️ *Motivo:* ${WARN_COUNT}ª Advertencia 
│  por envío de enlaces.
│
│  🛡️ Grupo protegido automáticamente 
│  por ${BOT_NAME}.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                            mentions: [sender]
                        });
                    } else {
                        await sock.sendMessage(jid, {
                            text: `╭━━━⊱ ⚠️ *ADVERTENCIA ${warningCount}/${WARN_COUNT}* ⊱━━━╮
│
│  👤 *Usuario:* ${userMention}
│  📝 *Motivo:* Envío de enlaces.
│
│  🚨 Tu mensaje fue eliminado. A la 
│  tercera advertencia serás expulsado 
│  automáticamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                            mentions: [sender]
                        });
                    }
                } catch (error) {
                    console.error('❌ Error en el sistema de advertencias de AntiLink:', error);
                    // Fallback: si falla el contador, al menos avisamos
                    await sock.sendMessage(jid, {
                        text: `╭━━━⊱ 🚫 *ENLACE DETECTADO* ⊱━━━╮
│
│  👤 *Usuario:* ${userMention}
│  📝 *Acción:* Mensaje eliminado.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                        mentions: [sender]
                    });
                }
                break;
        }
    } catch (error) {
        console.error('❌ Error crítico en Antilink detector:', error);
    }
}

module.exports = { handleAntilinkCommand, Antilink };