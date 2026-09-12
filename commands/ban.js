const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

// Ruta segura para el archivo de usuarios baneados
const BANNED_PATH = path.join(__dirname, '../data/banned.json');

/**
 * Obtiene la lista de usuarios baneados de forma segura.
 */
function getBannedUsers() {
    try {
        const dataDir = path.dirname(BANNED_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(BANNED_PATH)) {
            fs.writeFileSync(BANNED_PATH, JSON.stringify([], null, 2), 'utf8');
        }
        return JSON.parse(fs.readFileSync(BANNED_PATH, 'utf8'));
    } catch (error) {
        console.error('❌ Error al leer banned.json:', error);
        return [];
    }
}

/**
 * Guarda la lista de usuarios baneados de forma segura.
 */
function saveBannedUsers(users) {
    try {
        fs.writeFileSync(BANNED_PATH, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Error al guardar banned.json:', error);
    }
}

/**
 * Comando principal para banear usuarios (.ban)
 */
async function banCommand(sock, chatId, message) {
    try {
        const isGroup = chatId.endsWith('@g.us');
        const senderId = message.key.participant || message.key.remoteJid;
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Validación de permisos
        if (isGroup) {
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
            if (!isBotAdmin) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ Necesito ser *administrador del grupo* para poder banear usuarios.' 
                }, { quoted: message });
            }
            if (!isSenderAdmin && !message.key.fromMe) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ Lo siento, solo los *administradores del grupo* pueden usar este comando.' 
                }, { quoted: message });
            }
        } else {
            const senderIsSudo = await isSudo(senderId);
            if (!message.key.fromMe && !senderIsSudo) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ Este comando solo está disponible para el *dueño o sudo* en chats privados.' 
                }, { quoted: message });
            }
        }

        // 2. Extraer el usuario a banear (Mención o Respuesta)
        let userToBan = null;
        
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToBan = message.message.extendedTextMessage.contextInfo.participant;
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            // Soporte para mensajes efímeros
            userToBan = message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToBan) {
            const helpMessage = `╭━━━⊱ 🚫 *BANEO DE USUARIO* ⊱━━━╮
│
│  Bloquea el acceso al bot para un
│  usuario específico.
│
│  💡 *Uso:* .ban <mención o respuesta>
│  💡 *Ejemplo:* Responde a un mensaje
│  o menciona al usuario con @.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

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
        }

        // 3. Protección: Evitar que el bot se banee a sí mismo
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (userToBan === botId || userToBan === botId.replace('@s.whatsapp.net', '@lid')) {
            return await sock.sendMessage(chatId, { 
                text: '🤖 ¡No puedo banearme a mí mismo! Eso sería un suicidio digital.' 
            }, { quoted: message });
        }

        // 4. Ejecutar el baneo
        const bannedUsers = getBannedUsers();
        
        if (bannedUsers.includes(userToBan)) {
            return await sock.sendMessage(chatId, { 
                text: `⚠️ El usuario *@${userToBan.split('@')[0]}* ya se encuentra baneado.`,
                mentions: [userToBan]
            }, { quoted: message });
        }

        bannedUsers.push(userToBan);
        saveBannedUsers(bannedUsers);
        
        const userName = userToBan.split('@')[0];
        const dateStr = new Date().toLocaleString('es-EC', { 
            timeZone: 'America/Guayaquil',
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // 5. Mensaje de éxito con diseño premium y botón CTA
        const successMessage = `╭━━━⊱ 🚫 *USUARIO BANEADO* ⊱━━━╮
│
│  👤 *Usuario:* @${userName}
│  🛡️ *Baneado por:* Tú
│  📅 *Fecha:* ${dateStr}
│
│  ✅ El acceso a los comandos del bot
│  ha sido revocado exitosamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: successMessage,
            mentions: [userToBan],
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
        console.error('❌ Error en banCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al intentar banear al usuario. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

module.exports = banCommand;