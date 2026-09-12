const isAdmin = require('../lib/isAdmin');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
const TEMP_DIR = path.join(__dirname, '..', 'temp');

/**
 * Elimina un archivo temporal de forma segura para evitar fugas de memoria en el servidor.
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
 * Descarga contenido multimedia y lo guarda temporalmente con un nombre único.
 */
async function downloadMediaMessage(message, mediaType) {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
    
    const stream = await downloadContentFromMessage(message, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    
    const uniqueId = Math.random().toString(36).substring(7);
    const filePath = path.join(TEMP_DIR, `tag_${Date.now()}_${uniqueId}.${mediaType}`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

/**
 * Java Bot MD - Comando para Etiquetar con Respuesta (.tag)
 * Reenvía un mensaje (texto, imagen, video o documento) etiquetando a todos los miembros.
 */
async function tagCommand(sock, chatId, senderId, messageText, replyMessage, message) {
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
                footer: `🤖 ${BOT_NAME} | Administración`,
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
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
        
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *PERMISOS INSUFICIENTES* ⊱━━━╮
│
│  Necesito ser *administrador del grupo* 
│  para poder etiquetar a los miembros.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Administración`,
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

        // Si no es admin (y no es el dueño del bot), enviar sticker de advertencia o mensaje
        if (!isSenderAdmin && !message.key.fromMe) {
            const stickerPath = path.join(__dirname, '..', 'assets', 'sticktag.webp');
            if (fs.existsSync(stickerPath)) {
                await sock.sendMessage(chatId, { sticker: fs.readFileSync(stickerPath) }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, { 
                    text: '⚠️ Solo los *administradores del grupo* pueden usar este comando.' 
                }, { quoted: message });
            }
            return;
        }

        // 3. Obtener lista de participantes
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const mentionedJidList = participants.map(p => p.id);

        if (mentionedJidList.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ No se encontraron participantes en este grupo.' }, { quoted: message });
        }

        // 4. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '📢', key: message.key } });

        // 5. Extraer mensaje citado (soporta mensajes normales y efímeros)
        const ctx = message.message?.extendedTextMessage?.contextInfo || 
                    message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;
        const quoted = ctx?.quotedMessage || replyMessage;

        let messageContent = {};
        let tempFilePath = null;

        // 6. Construir el contenido según el tipo de mensaje respondido
        if (quoted) {
            if (quoted.imageMessage) {
                tempFilePath = await downloadMediaMessage(quoted.imageMessage, 'image');
                messageContent = {
                    image: { url: tempFilePath },
                    caption: messageText || quoted.imageMessage.caption || '📢 *Convocatoria General*',
                    mentions: mentionedJidList
                };
            } else if (quoted.videoMessage) {
                tempFilePath = await downloadMediaMessage(quoted.videoMessage, 'video');
                messageContent = {
                    video: { url: tempFilePath },
                    caption: messageText || quoted.videoMessage.caption || '📢 *Convocatoria General*',
                    mentions: mentionedJidList
                };
            } else if (quoted.conversation || quoted.extendedTextMessage) {
                messageContent = {
                    text: messageText || quoted.conversation || quoted.extendedTextMessage?.text || '📢 *Convocatoria General*',
                    mentions: mentionedJidList
                };
            } else if (quoted.documentMessage) {
                tempFilePath = await downloadMediaMessage(quoted.documentMessage, 'document');
                messageContent = {
                    document: { url: tempFilePath },
                    fileName: quoted.documentMessage.fileName || 'documento',
                    caption: messageText || '📢 *Convocatoria General*',
                    mentions: mentionedJidList
                };
            } else {
                // Fallback a texto si el tipo de medio no es soportado
                messageContent = { text: messageText || '📢 *Convocatoria General*', mentions: mentionedJidList };
            }
        } else {
            // Si no hay respuesta, solo enviar el texto con las menciones
            messageContent = { text: messageText || '📢 *Convocatoria General*', mentions: mentionedJidList };
        }

        // 7. Enviar el mensaje
        if (Object.keys(messageContent).length > 0) {
            await sock.sendMessage(chatId, messageContent, { quoted: message });
            
            // 8. Reacción de éxito
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        }

        // 9. Limpieza segura del archivo temporal (crítico para la salud del servidor)
        if (tempFilePath) {
            safeUnlink(tempFilePath);
        }

    } catch (error) {
        console.error('❌ Error en tagCommand:', error);
        
        // Limpieza de emergencia en caso de fallo
        // (Nota: tempFilePath no está en este scope, pero el catch general previene crasheos)
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al intentar 
│  etiquetar a los miembros.
│
│  💡 *Posible causa:* El mensaje 
│  respondido es de un tipo no soportado 
│  o la conexión es inestable.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Soporte técnico`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Reportar en el Canal',
                    url: CHANNEL_LINK,
                    merchant_url: CHANNEL_LINK
                })
            }],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = tagCommand;