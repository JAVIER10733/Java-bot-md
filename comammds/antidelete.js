const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

// Asegurar que la carpeta temporal exista
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

/**
 * Limpia la carpeta temporal si supera los 200MB para evitar llenar el disco.
 */
const cleanTempFolder = () => {
    try {
        if (!fs.existsSync(TEMP_MEDIA_DIR)) return;
        const files = fs.readdirSync(TEMP_MEDIA_DIR);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(TEMP_MEDIA_DIR, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) totalSize += stats.size;
        }

        if (totalSize > 200 * 1024 * 1024) { // 200 MB
            for (const file of files) {
                fs.unlinkSync(path.join(TEMP_MEDIA_DIR, file));
            }
            console.log('🧹 Carpeta temporal limpiada por exceso de tamaño (>200MB)');
        }
    } catch (err) {
        console.error('❌ Error en limpieza de carpeta temporal:', err);
    }
};
// Ejecutar cada 1 minuto
setInterval(cleanTempFolder, 60 * 1000);

/**
 * Función auxiliar para descargar buffers de forma segura en Baileys.
 */
async function downloadMediaBuffer(messageContent, type) {
    const stream = await downloadContentFromMessage(messageContent, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

/**
 * Carga la configuración de Antidelete.
 */
function loadAntideleteConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false };
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch {
        return { enabled: false };
    }
}

/**
 * Guarda la configuración de Antidelete de forma segura.
 */
function saveAntideleteConfig(config) {
    try {
        const dataDir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (err) {
        console.error('❌ Error al guardar config de Antidelete:', err);
    }
}

/**
 * Comando principal para gestionar Antidelete (.antidelete)
 */
async function handleAntideleteCommand(sock, chatId, message, match) {
    try {
        if (!message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando global. Solo el *dueño del bot* puede configurarlo.' 
            }, { quoted: message });
        }

        const config = loadAntideleteConfig();
        const sub = (match || '').trim().toLowerCase();
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // Menú de ayuda
        if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
            const helpMessage = `╭━━━⊱ 🛡️ *ANTIDELETE* ⊱━━━╮
│
│  Recupera mensajes eliminados y
│  captura mensajes de "Ver una vez".
│
│  ⚙️ *Comandos disponibles:*
│  • *.antidelete on*     → Activar el sistema
│  • *.antidelete off*    → Desactivar el sistema
│  • *.antidelete status* → Ver estado actual
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🔒 Los reportes se envían directamente al dueño del bot.`;

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

        // Mostrar estado
        if (sub === 'status') {
            const statusEmoji = config.enabled ? '🟢' : '🔴';
            const statusText = config.enabled ? 'ACTIVADO' : 'DESACTIVADO';
            
            const statusMessage = `╭━━━⊱ 📊 *ESTADO DEL SISTEMA* ⊱━━━╮
│
│  🛡️ *Antidelete:* ${statusEmoji} *${statusText}*
│
│  ${config.enabled 
                ? 'El bot está guardando mensajes y capturando "Ver una vez".' 
                : 'El sistema de recuperación está apagado.'}
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

        // Activar o Desactivar
        config.enabled = sub === 'on';
        saveAntideleteConfig(config);

        const actionEmoji = config.enabled ? '✅' : '🔓';
        const actionText = config.enabled ? 'activado' : 'desactivado';
        const actionDesc = config.enabled 
            ? 'El bot ahora guardará mensajes eliminados y capturará "Ver una vez".' 
            : 'El bot ha dejado de guardar mensajes eliminados.';

        const successMessage = `╭━━━⊱ ⚙️ *CONFIGURACIÓN ACTUALIZADA* ⊱━━━╮
│
│  🛡️ *Antidelete:* ${actionEmoji} *${actionText.toUpperCase()}*
│
│  📝 *Nota:* ${actionDesc}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: successMessage,
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

    } catch (error) {
        console.error('❌ Error en handleAntideleteCommand:', error);
    }
}

/**
 * Almacena mensajes entrantes para recuperación y Anti-ViewOnce.
 */
async function storeMessage(sock, message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;
        if (!message.key?.id) return;

        const messageId = message.key.id;
        const sender = message.key.participant || message.key.remoteJid;
        
        let content = '';
        let mediaType = '';
        let mediaPath = '';
        let isViewOnce = false;

        // Detectar contenedor ViewOnce
        const viewOnceContainer = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;
        
        if (viewOnceContainer) {
            isViewOnce = true;
            if (viewOnceContainer.imageMessage) {
                mediaType = 'image';
                content = viewOnceContainer.imageMessage.caption || '';
                const buffer = await downloadMediaBuffer(viewOnceContainer.imageMessage, 'image');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
                fs.writeFileSync(mediaPath, buffer);
            } else if (viewOnceContainer.videoMessage) {
                mediaType = 'video';
                content = viewOnceContainer.videoMessage.caption || '';
                const buffer = await downloadMediaBuffer(viewOnceContainer.videoMessage, 'video');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
                fs.writeFileSync(mediaPath, buffer);
            }
        } else if (message.message?.conversation) {
            content = message.message.conversation;
        } else if (message.message?.extendedTextMessage?.text) {
            content = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage) {
            mediaType = 'image';
            content = message.message.imageMessage.caption || '';
            const buffer = await downloadMediaBuffer(message.message.imageMessage, 'image');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
            fs.writeFileSync(mediaPath, buffer);
        } else if (message.message?.stickerMessage) {
            mediaType = 'sticker';
            const buffer = await downloadMediaBuffer(message.message.stickerMessage, 'sticker');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);
            fs.writeFileSync(mediaPath, buffer);
        } else if (message.message?.videoMessage) {
            mediaType = 'video';
            content = message.message.videoMessage.caption || '';
            const buffer = await downloadMediaBuffer(message.message.videoMessage, 'video');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
            fs.writeFileSync(mediaPath, buffer);
        } else if (message.message?.audioMessage) {
            mediaType = 'audio';
            const mime = message.message.audioMessage.mimetype || '';
            const ext = mime.includes('ogg') ? 'ogg' : 'mp3';
            const buffer = await downloadMediaBuffer(message.message.audioMessage, 'audio');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
            fs.writeFileSync(mediaPath, buffer);
        }

        // Guardar en memoria
        messageStore.set(messageId, {
            content,
            mediaType,
            mediaPath,
            sender,
            group: message.key.remoteJid.endsWith('@g.us') ? message.key.remoteJid : null,
            timestamp: new Date().toISOString()
        });

        // Anti-ViewOnce: Reenviar inmediatamente al dueño
        if (isViewOnce && mediaType && fs.existsSync(mediaPath)) {
            try {
                const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const senderName = sender.split('@')[0];
                const caption = `👁️ *Anti-ViewOnce Detectado*\n\n👤 *De:* @${senderName}\n📝 *Nota:* ${content || 'Sin texto'}`;
                
                const mediaOptions = { caption, mentions: [sender] };
                
                if (mediaType === 'image') {
                    await sock.sendMessage(ownerNumber, { image: { url: mediaPath }, ...mediaOptions });
                } else if (mediaType === 'video') {
                    await sock.sendMessage(ownerNumber, { video: { url: mediaPath }, ...mediaOptions });
                }
                
                // Limpiar inmediatamente después de enviar
                fs.unlinkSync(mediaPath);
            } catch (e) {
                console.error('❌ Error al reenviar ViewOnce:', e);
            }
        }

    } catch (err) {
        console.error('❌ Error en storeMessage:', err);
    }
}

/**
 * Maneja la revocación (eliminación) de mensajes.
 */
async function handleMessageRevocation(sock, revocationMessage) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        const messageId = revocationMessage.message?.protocolMessage?.key?.id;
        if (!messageId) return;

        const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
        const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Ignorar si el bot o el dueño lo borró
        if (deletedBy.includes(sock.user.id) || deletedBy === ownerNumber) return;

        const original = messageStore.get(messageId);
        if (!original) return;

        const sender = original.sender;
        const senderName = sender.split('@')[0];
        const deletedByName = deletedBy.split('@')[0];
        
        let groupName = 'Chat Privado';
        if (original.group) {
            try {
                const metadata = await sock.groupMetadata(original.group);
                groupName = metadata.subject || 'Grupo desconocido';
            } catch {
                groupName = 'Grupo desconocido';
            }
        }

        // Zona horaria de Ecuador (Los Ríos)
        const time = new Date().toLocaleString('es-EC', {
            timeZone: 'America/Guayaquil',
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        let text = `╭━━━⊱ 🗑️ *MENSAJE ELIMINADO* ⊱━━━╮
│
│ 👤 *Enviado por:* @${senderName}
│ 🗑️ *Eliminado por:* @${deletedByName}
│ 👥 *Lugar:* ${groupName}
│ 🕒 *Hora:* ${time}
│`;

        if (original.content) {
            text += `\n💬 *Texto eliminado:*\n└─ _${original.content}_\n`;
        }
        text += `\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // Enviar reporte de texto
        await sock.sendMessage(ownerNumber, {
            text,
            mentions: [sender, deletedBy]
        });

        // Enviar multimedia si existe
        if (original.mediaType && fs.existsSync(original.mediaPath)) {
            const mediaOptions = {
                caption: `📎 *Archivo recuperado:* ${original.mediaType}\n👤 *De:* @${senderName}`,
                mentions: [sender]
            };

            try {
                switch (original.mediaType) {
                    case 'image':
                        await sock.sendMessage(ownerNumber, { image: { url: original.mediaPath }, ...mediaOptions });
                        break;
                    case 'sticker':
                        await sock.sendMessage(ownerNumber, { sticker: { url: original.mediaPath } });
                        break;
                    case 'video':
                        await sock.sendMessage(ownerNumber, { video: { url: original.mediaPath }, ...mediaOptions });
                        break;
                    case 'audio':
                        await sock.sendMessage(ownerNumber, { 
                            audio: { url: original.mediaPath }, 
                            mimetype: 'audio/mpeg', 
                            ptt: false,
                            ...mediaOptions 
                        });
                        break;
                }
            } catch (err) {
                console.error('❌ Error al enviar media recuperada:', err);
            }

            // Limpieza final del archivo temporal
            try {
                fs.unlinkSync(original.mediaPath);
            } catch (err) {
                console.error('❌ Error al limpiar archivo temporal:', err);
            }
        }

        // Eliminar de la memoria
        messageStore.delete(messageId);

    } catch (err) {
        console.error('❌ Error en handleMessageRevocation:', err);
    }
}

module.exports = {
    handleAntideleteCommand,
    handleMessageRevocation,
    storeMessage
};