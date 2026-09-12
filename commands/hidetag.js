const isAdmin = require('../lib/isAdmin');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

/**
 * Descarga contenido multimedia de forma segura y lo guarda en un archivo temporal.
 */
async function downloadMediaMessage(message, mediaType) {
    const stream = await downloadContentFromMessage(message, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, `${Date.now()}_${Math.random().toString(36).substring(7)}.${mediaType}`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

/**
 * Elimina un archivo temporal de forma segura.
 */
function safeUnlink(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.warn('⚠️ No se pudo eliminar archivo temporal:', filePath);
    }
}

/**
 * Comando para etiquetar a todos los miembros (excepto admins) de forma oculta.
 */
async function hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar en *grupos*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Administración`,
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

        // 2. Validar permisos
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);

        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Necesito ser *administrador del grupo* 
│  para poder etiquetar a los miembros.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Administración`,
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

        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Solo los *administradores del grupo* 
│  pueden usar este comando.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Administración`,
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

        // 3. Obtener participantes del grupo
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        
        // Etiquetar solo a no-admins (miembros regulares)
        const membersToTag = participants.filter(p => !p.admin).map(p => p.id);

        if (membersToTag.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ No hay miembros regulares para etiquetar (todos son administradores).' 
            }, { quoted: message });
        }

        // 4. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🏷️', key: message.key } });

        // 5. Preparar contenido basado en el tipo de mensaje respondido
        let content = {};
        let tempFilePath = null;

        if (replyMessage) {
            try {
                if (replyMessage.imageMessage) {
                    tempFilePath = await downloadMediaMessage(replyMessage.imageMessage, 'image');
                    content = { 
                        image: { url: tempFilePath }, 
                        caption: messageText || replyMessage.imageMessage.caption || '📢 *Atención*', 
                        mentions: membersToTag 
                    };
                } else if (replyMessage.videoMessage) {
                    tempFilePath = await downloadMediaMessage(replyMessage.videoMessage, 'video');
                    content = { 
                        video: { url: tempFilePath }, 
                        caption: messageText || replyMessage.videoMessage.caption || '📢 *Atención*', 
                        mentions: membersToTag 
                    };
                } else if (replyMessage.conversation || replyMessage.extendedTextMessage) {
                    content = { 
                        text: messageText || replyMessage.conversation || replyMessage.extendedTextMessage?.text || '📢 *Atención*', 
                        mentions: membersToTag 
                    };
                } else if (replyMessage.documentMessage) {
                    tempFilePath = await downloadMediaMessage(replyMessage.documentMessage, 'document');
                    content = { 
                        document: { url: tempFilePath }, 
                        fileName: replyMessage.documentMessage.fileName || 'documento',
                        caption: messageText || '📢 *Atención*', 
                        mentions: membersToTag 
                    };
                } else if (replyMessage.audioMessage) {
                    tempFilePath = await downloadMediaMessage(replyMessage.audioMessage, 'audio');
                    content = { 
                        audio: { url: tempFilePath }, 
                        mimetype: replyMessage.audioMessage.mimetype || 'audio/mpeg',
                        mentions: membersToTag 
                    };
                } else if (replyMessage.stickerMessage) {
                    tempFilePath = await downloadMediaMessage(replyMessage.stickerMessage, 'sticker');
                    content = { 
                        sticker: { url: tempFilePath },
                        mentions: membersToTag 
                    };
                }
            } catch (downloadError) {
                console.error('❌ Error al descargar multimedia:', downloadError);
                // Fallback a texto si falla la descarga
                content = { 
                    text: messageText || '📢 *Atención*', 
                    mentions: membersToTag 
                };
            }
        } else {
            // Solo texto si no hay mensaje respondido
            content = { 
                text: messageText || '📢 *Atención*', 
                mentions: membersToTag 
            };
        }

        // 6. Enviar el mensaje etiquetado
        if (Object.keys(content).length > 0) {
            await sock.sendMessage(chatId, content, { quoted: message });
            
            // 7. Reacción de éxito
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        }

        // 8. Limpieza segura del archivo temporal
        if (tempFilePath) {
            safeUnlink(tempFilePath);
        }

    } catch (error) {
        console.error('❌ Error en hideTagCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Ocurrió un error al intentar etiquetar.
│  Por favor, inténtalo de nuevo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
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
        }, { quoted: message });
    }
}

module.exports = hideTagCommand;