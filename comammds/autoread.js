/**
 * Java Bot MD - Comando de Lectura Automática (Autoread)
 * Lee automáticamente los mensajes entrantes para mantener el estado "visto".
 */

const fs = require('fs');
const path = require('path');

// Ruta para almacenar la configuración
const configPath = path.join(__dirname, '..', 'data', 'autoread.json');

/**
 * Inicializa el archivo de configuración si no existe.
 */
function initConfig() {
    try {
        if (!fs.existsSync(configPath)) {
            const dataDir = path.dirname(configPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2), 'utf8');
        }
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
        console.error('❌ Error al inicializar la configuración de Autoread:', error);
        return { enabled: false };
    }
}

/**
 * Comando principal para gestionar la lectura automática (.autoread)
 */
async function autoreadCommand(sock, chatId, message) {
    try {
        // 1. Validación de seguridad: Solo el dueño del bot puede usar este comando
        if (!message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando global. Solo el *dueño del bot* puede configurarlo.' 
            }, { quoted: message });
        }

        // 2. Extraer argumentos
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = text.trim().split(' ').slice(1);
        
        const config = initConfig();
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 3. Procesar la acción
        if (args.length > 0) {
            const action = args[0].toLowerCase();
            
            if (action === 'on' || action === 'enable' || action === 'activar') {
                config.enabled = true;
            } else if (action === 'off' || action === 'disable' || action === 'desactivar') {
                config.enabled = false;
            } else {
                return await sock.sendMessage(chatId, {
                    text: '❌ *Opción no válida.*\n\nPor favor, usa:\n• `.autoread on` (Activar)\n• `.autoread off` (Desactivar)'
                }, { quoted: message });
            }
        } else {
            // Si no hay argumentos, alternar el estado actual
            config.enabled = !config.enabled;
        }
        
        // 4. Guardar la configuración actualizada
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        
        // 5. Enviar confirmación con diseño premium y botón CTA
        const statusEmoji = config.enabled ? '✅' : '🔓';
        const statusText = config.enabled ? 'ACTIVADO' : 'DESACTIVADO';
        const statusDesc = config.enabled 
            ? 'El bot marcará automáticamente como leídos todos los mensajes entrantes.' 
            : 'El bot ya no marcará los mensajes como leídos automáticamente.';

        const successMessage = `╭━━━⊱ 👁️ *LECTURA AUTOMÁTICA* ⊱━━━╮
│
│  🤖 *Estado:* ${statusEmoji} *${statusText}*
│
│  📝 *Nota:* ${statusDesc}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: successMessage,
            footer: `🤖 ${botName} | Configuración global`,
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
        console.error('❌ Error en autoreadCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al procesar la configuración. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

/**
 * Verifica si la lectura automática está habilitada.
 */
function isAutoreadEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('❌ Error al verificar el estado de Autoread:', error);
        return false;
    }
}

/**
 * Verifica si el bot ha sido mencionado en un mensaje.
 */
function isBotMentionedInMessage(message, botNumber) {
    if (!message.message) return false;
    
    // 1. Verificar menciones explícitas en el array mentionedJid
    const messageTypes = [
        'extendedTextMessage', 'imageMessage', 'videoMessage', 'stickerMessage',
        'documentMessage', 'audioMessage', 'contactMessage', 'locationMessage'
    ];
    
    for (const type of messageTypes) {
        if (message.message[type]?.contextInfo?.mentionedJid) {
            const mentionedJid = message.message[type].contextInfo.mentionedJid;
            if (mentionedJid.some(jid => jid === botNumber)) {
                return true;
            }
        }
    }
    
    // 2. Verificar menciones por texto (@numero o nombre del bot)
    const textContent = 
        message.message.conversation || 
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption || '';
    
    if (textContent) {
        const botUsername = botNumber.split('@')[0];
        if (textContent.includes(`@${botUsername}`)) {
            return true;
        }
        
        // Verificar menciones por nombre del bot (opcional, en minúsculas)
        const botNames = [global.botname?.toLowerCase(), 'bot', 'java bot', 'java'];
        const words = textContent.toLowerCase().split(/\s+/);
        if (botNames.some(name => name && words.includes(name))) {
            return true;
        }
    }
    
    return false;
}

/**
 * Maneja la lógica de lectura automática de mensajes.
 */
async function handleAutoread(sock, message) {
    if (isAutoreadEnabled()) {
        try {
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const isBotMentioned = isBotMentionedInMessage(message, botNumber);
            
            if (isBotMentioned) {
                // Si el bot es mencionado, NO lo marcamos como leído en la UI 
                // para que el usuario sepa que hay una mención pendiente de responder.
                return false; 
            } else {
                // Para mensajes regulares, marcar como leído normalmente.
                const key = { 
                    remoteJid: message.key.remoteJid, 
                    id: message.key.id, 
                    participant: message.key.participant 
                };
                await sock.readMessages([key]);
                return true; 
            }
        } catch (error) {
            console.error('❌ Error en handleAutoread:', error);
            return false;
        }
    }
    return false;
}

module.exports = {
    autoreadCommand,
    isAutoreadEnabled,
    isBotMentionedInMessage,
    handleAutoread
};