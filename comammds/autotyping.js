/**
 * Java Bot MD - Comando de Escritura Automática (Autotyping)
 * Muestra el estado de "escribiendo..." de forma simulada para una experiencia más realista y humana.
 */

const fs = require('fs');
const path = require('path');

// Ruta para almacenar la configuración
const configPath = path.join(__dirname, '..', 'data', 'autotyping.json');

/**
 * Inicializa el archivo de configuración si no existe de forma segura.
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
        console.error('❌ Error al inicializar la configuración de Autotyping:', error);
        return { enabled: false }; // Fallback seguro
    }
}

/**
 * Comando principal para gestionar la escritura automática (.autotyping)
 */
async function autotypingCommand(sock, chatId, message) {
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
                    text: '❌ *Opción no válida.*\n\nPor favor, usa:\n• `.autotyping on` (Activar)\n• `.autotyping off` (Desactivar)'
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
            ? 'El bot simulará que está escribiendo antes de responder.' 
            : 'El bot responderá inmediatamente sin simular escritura.';

        const successMessage = `╭━━━⊱ ⌨️ *ESCRITURA AUTOMÁTICA* ⊱━━━╮
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
        console.error('❌ Error en autotypingCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al procesar la configuración. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

/**
 * Verifica si la escritura automática está habilitada.
 */
function isAutotypingEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('❌ Error al verificar el estado de Autotyping:', error);
        return false;
    }
}

/**
 * Maneja la escritura automática para mensajes regulares (simula tiempo de lectura/escritura).
 */
async function handleAutotypingForMessage(sock, chatId, userMessage) {
    if (isAutotypingEnabled()) {
        try {
            await sock.presenceSubscribe(chatId);
            await sock.sendPresenceUpdate('available', chatId);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await sock.sendPresenceUpdate('composing', chatId);
            
            // Simular tiempo de escritura basado en la longitud del mensaje (mínimo 3s, máximo 8s)
            const typingDelay = Math.max(3000, Math.min(8000, userMessage.length * 150));
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 1500));
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true;
        } catch (error) {
            console.error('❌ Error al enviar indicador de escritura (mensaje):', error);
            return false;
        }
    }
    return false;
}

/**
 * Maneja la escritura automática para comandos (antes de la ejecución).
 * Nota: Se mantiene por compatibilidad, aunque showTypingAfterCommand es el preferido.
 */
async function handleAutotypingForCommand(sock, chatId) {
    if (isAutotypingEnabled()) {
        try {
            await sock.presenceSubscribe(chatId);
            await sock.sendPresenceUpdate('available', chatId);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await sock.sendPresenceUpdate('composing', chatId);
            
            const commandTypingDelay = 3000;
            await new Promise(resolve => setTimeout(resolve, commandTypingDelay));
            
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 1500));
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true;
        } catch (error) {
            console.error('❌ Error al enviar indicador de escritura (comando):', error);
            return false;
        }
    }
    return false;
}

/**
 * Muestra el estado de escritura DESPUÉS de la ejecución del comando.
 */
async function showTypingAfterCommand(sock, chatId) {
    if (isAutotypingEnabled()) {
        try {
            await sock.presenceSubscribe(chatId);
            await sock.sendPresenceUpdate('composing', chatId);
            
            // Mantener visible brevemente
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true;
        } catch (error) {
            console.error('❌ Error al enviar indicador de escritura post-comando:', error);
            return false;
        }
    }
    return false;
}

module.exports = {
    autotypingCommand,
    isAutotypingEnabled,
    handleAutotypingForMessage,
    handleAutotypingForCommand,
    showTypingAfterCommand
};