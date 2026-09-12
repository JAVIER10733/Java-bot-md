const isAdmin = require('../lib/isAdmin');
const store = require('../lib/lightweight_store');

/**
 * Java Bot MD - Comando de Eliminación de Mensajes (.del / .delete)
 * Permite a los administradores eliminar mensajes específicos o los más recientes del grupo.
 */
async function deleteCommand(sock, chatId, message, senderId) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Validación de permisos
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);

        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Necesito ser *administrador del grupo* para poder eliminar mensajes.' 
            }, { quoted: message });
        }

        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Lo siento, solo los *administradores del grupo* pueden usar este comando.' 
            }, { quoted: message });
        }

        // 2. Parsear argumentos del comando
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/);
        let countArg = null;
        
        // Verificar si se proporcionó un número (ej: .del 5)
        if (parts.length > 1) {
            const maybeNum = parseInt(parts[1], 10);
            if (!isNaN(maybeNum) && maybeNum > 0) {
                countArg = Math.min(maybeNum, 50); // Límite de seguridad de 50 mensajes
            }
        }
        
        // Extraer contexto de respuesta o mención
        const ctxInfo = message.message?.extendedTextMessage?.contextInfo || {};
        const repliedParticipant = ctxInfo.participant || null;
        const repliedMsgId = ctxInfo.stanzaId || null;
        const mentioned = Array.isArray(ctxInfo.mentionedJid) && ctxInfo.mentionedJid.length > 0 ? ctxInfo.mentionedJid[0] : null;
        
        // 3. Determinar el objetivo y la cantidad
        let targetUser = null;
        let deleteGroupMessages = false;

        if (repliedParticipant && repliedMsgId) {
            targetUser = repliedParticipant;
            countArg = countArg || 1; // Por defecto 1 si es respuesta
        } else if (mentioned) {
            targetUser = mentioned;
            countArg = countArg || 1; // Por defecto 1 si es mención
        } else if (countArg === null) {
            // Sin número, sin mención y sin respuesta: mostrar ayuda
            const helpMessage = `╭━━━⊱ 🗑️ *ELIMINAR MENSAJES* ⊱━━━╮
│
│  Elimina mensajes recientes del grupo
│  o de un usuario específico.
│
│  💡 *Usos disponibles:*
│  • *.del 5* → Elimina los últimos 5 mensajes del grupo.
│  • *.del 3 @usuario* → Elimina los últimos 3 mensajes de @usuario.
│  • *.del* (respondiendo) → Elimina el mensaje respondido.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Moderación`,
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
        } else {
            // Solo se proporcionó un número, sin usuario específico
            deleteGroupMessages = true;
        }

        // 4. Recopilar mensajes del store de forma segura
        const chatMessages = Array.isArray(store?.messages?.[chatId]) ? store.messages[chatId] : [];
        const toDelete = [];
        const seenIds = new Set();

        if (deleteGroupMessages) {
            // Eliminar los últimos N mensajes del grupo (cualquier usuario)
            for (let i = chatMessages.length - 1; i >= 0 && toDelete.length < countArg; i--) {
                const m = chatMessages[i];
                if (!seenIds.has(m.key.id) && !m.message?.protocolMessage && !m.key.fromMe && m.key.id !== message.key.id) {
                    toDelete.push(m);
                    seenIds.add(m.key.id);
                }
            }
        } else {
            // Eliminar mensajes de un usuario específico
            if (repliedMsgId) {
                // Priorizar el mensaje exacto al que se respondió
                const repliedInStore = chatMessages.find(m => m.key.id === repliedMsgId && (m.key.participant || m.key.remoteJid) === targetUser);
                if (repliedInStore) {
                    toDelete.push(repliedInStore);
                    seenIds.add(repliedInStore.key.id);
                } else {
                    // Fallback: intentar eliminar directamente por ID si no está en el store
                    try {
                        await sock.sendMessage(chatId, {
                            delete: { remoteJid: chatId, fromMe: false, id: repliedMsgId, participant: repliedParticipant }
                        });
                        countArg = Math.max(0, countArg - 1);
                    } catch (e) { /* Ignorar si falla */ }
                }
            }
            
            // Rellenar el resto hasta llegar a countArg
            for (let i = chatMessages.length - 1; i >= 0 && toDelete.length < countArg; i--) {
                const m = chatMessages[i];
                const participant = m.key.participant || m.key.remoteJid;
                if (participant === targetUser && !seenIds.has(m.key.id) && !m.message?.protocolMessage) {
                    toDelete.push(m);
                    seenIds.add(m.key.id);
                }
            }
        }

        // 5. Validar si se encontraron mensajes para eliminar
        if (toDelete.length === 0) {
            const errorMsg = deleteGroupMessages 
                ? '⚠️ No se encontraron mensajes recientes válidos en el grupo para eliminar.' 
                : `⚠️ No se encontraron mensajes recientes de *@${targetUser.split('@')[0]}* para eliminar.`;
            
            return await sock.sendMessage(chatId, { 
                text: errorMsg,
                mentions: targetUser ? [targetUser] : []
            }, { quoted: message });
        }

        // 6. Ejecutar la eliminación secuencial con retraso para evitar Rate Limits (429)
        let deletedCount = 0;
        for (const m of toDelete) {
            try {
                const msgParticipant = deleteGroupMessages ? (m.key.participant || m.key.remoteJid) : (m.key.participant || targetUser);
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: m.key.id,
                        participant: msgParticipant
                    }
                });
                deletedCount++;
                await new Promise(r => setTimeout(r, 350)); // 350ms de seguridad entre eliminaciones
            } catch (e) {
                console.warn(`⚠️ No se pudo eliminar el mensaje ${m.key.id}:`, e.message);
            }
        }

        // 7. Mensaje de éxito con diseño premium y botón CTA
        const targetText = deleteGroupMessages ? 'del grupo' : `de *@${targetUser.split('@')[0]}*`;
        const successMessage = `╭━━━⊱ ✅ *LIMPIEZA COMPLETADA* ⊱━━━╮
│
│  🗑️ *Mensajes eliminados:* ${deletedCount}
│  👥 *Objetivo:* ${targetText}
│
│  🛡️ El chat ha sido limpiado 
│  exitosamente por la administración.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: successMessage,
            mentions: targetUser ? [targetUser] : [],
            footer: `🤖 ${botName} | Moderación segura`,
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
        console.error('❌ Error en deleteCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error inesperado al intentar eliminar los mensajes. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

module.exports = deleteCommand;