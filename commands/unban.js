const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BANNED_FILE_PATH = path.join(DATA_DIR, 'banned.json');
const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Asegura que el directorio y el archivo de usuarios baneados existan de forma segura.
 */
function initializeBannedFile() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(BANNED_FILE_PATH)) {
            fs.writeFileSync(BANNED_FILE_PATH, JSON.stringify([]), 'utf8');
        }
    } catch (error) {
        console.error('❌ Error al inicializar banned.json:', error.message);
    }
}

/**
 * Java Bot MD - Comando para Desbanear Usuarios (.unban)
 * Elimina a un usuario de la lista de restricciones, permitiéndole usar el bot nuevamente.
 */
async function unbanCommand(sock, chatId, message) {
    try {
        initializeBannedFile();

        const isGroup = chatId.endsWith('@g.us');
        const senderId = message.key.participant || message.key.remoteJid;

        // 1. Validar permisos según el contexto (Grupo o Privado)
        if (isGroup) {
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
            
            if (!isBotAdmin) {
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ ❌ *PERMISOS INSUFICIENTES* ⊱━━━╮
│
│  Necesito ser *administrador del grupo* 
│  para gestionar la lista de baneados.
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
│  Solo los *administradores del grupo* 
│  (o el dueño del bot) pueden desbanear 
│  usuarios.
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
        } else {
            const senderIsSudo = await isSudo(senderId);
            if (!message.key.fromMe && !senderIsSudo) {
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ ❌ *ACCESO DENEGADO* ⊱━━━╮
│
│  Este es un comando global. Solo el 
│  *dueño o sudo* del bot puede usarlo 
│  en chats privados.
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
        }

        // 2. Extraer el usuario objetivo (Soporta menciones, respuestas y mensajes efímeros)
        let userToUnban = null;
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToUnban = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToUnban = message.message.extendedTextMessage.contextInfo.participant;
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            userToUnban = message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToUnban) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🔓 *DESBANEO DE USUARIOS* ⊱━━━╮
│
│  Elimina a un usuario de la lista 
│  de baneados para que pueda volver 
│  a usar el bot.
│
│  💡 *Uso:* .unban <mención o respuesta>
│  💡 *Ejemplo:* Responde al mensaje del 
│  usuario o menciónalo con @.
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

        // Protección: Evitar que el bot intente desbanearse a sí mismo
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (userToUnban === botId) {
            return await sock.sendMessage(chatId, { text: '🤖 No puedo desbanearme a mí mismo. ¡Siempre estoy aquí para ayudarte!' }, { quoted: message });
        }

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🔓', key: message.key } });

        // 4. Leer y actualizar el archivo de baneados de forma segura
        let bannedUsers = [];
        try {
            const rawData = fs.readFileSync(BANNED_FILE_PATH, 'utf8');
            bannedUsers = rawData.trim() ? JSON.parse(rawData) : [];
        } catch (error) {
            console.warn('⚠️ Archivo banned.json corrupto o vacío, reiniciando...');
            bannedUsers = [];
        }

        const index = bannedUsers.indexOf(userToUnban);
        const userName = userToUnban.split('@')[0];

        if (index > -1) {
            // Usuario encontrado, eliminarlo de la lista
            bannedUsers.splice(index, 1);
            
            try {
                fs.writeFileSync(BANNED_FILE_PATH, JSON.stringify(bannedUsers, null, 2), 'utf8');
            } catch (error) {
                throw new Error('No se pudo guardar el archivo de baneados.');
            }

            // 5. Mensaje de éxito
            const successMessage = `╭━━━⊱ ✅ *USUARIO DESBANEADO* ⊱━━━╮
│
│  👤 *Usuario:* @${userName}
│  🔓 *Estado:* Acceso restaurado
│
│  📝 El usuario ha sido eliminado de 
│  la lista de restricciones y ya puede 
│  interactuar con el bot normalmente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            await sock.sendMessage(chatId, {
                text: successMessage,
                mentions: [userToUnban],
                footer: `🤖 ${BOT_NAME} | Moderación segura`,
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

            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

        } else {
            // Usuario no estaba baneado
            await sock.sendMessage(chatId, { react: { text: '⚠️', key: message.key } });
            
            const notBannedMessage = `╭━━━⊱ ⚠️ *USUARIO NO BANEADO* ⊱━━━╮
│
│  👤 *Usuario:* @${userName}
│
│  ℹ️ Este usuario no se encuentra en 
│  la lista de restricciones. No es 
│  necesario realizar ninguna acción.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            await sock.sendMessage(chatId, {
                text: notBannedMessage,
                mentions: [userToUnban],
                footer: `🤖 ${BOT_NAME} | Moderación segura`,
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
        console.error('❌ Error en unbanCommand:', error);
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al intentar 
│  desbanear al usuario.
│
│  💡 *Posible causa:* El archivo de 
│  datos está bloqueado o corrupto.
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

module.exports = unbanCommand;
