const fs = require('fs');
const path = require('path');

const PMBLOCKER_PATH = path.join(__dirname, '../data/pmblocker.json');
const DEFAULT_MESSAGE = '⚠️ *¡Acceso Restringido!*\n\nLos mensajes directos a este bot están bloqueados.\nPor favor, contacta al dueño únicamente a través de los grupos oficiales.';

/**
 * Lee el estado actual del sistema PM Blocker de forma segura.
 */
function readState() {
    try {
        if (!fs.existsSync(PMBLOCKER_PATH)) {
            return { enabled: false, message: DEFAULT_MESSAGE };
        }
        const raw = fs.readFileSync(PMBLOCKER_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return {
            enabled: !!data.enabled,
            message: typeof data.message === 'string' && data.message.trim() ? data.message : DEFAULT_MESSAGE
        };
    } catch (error) {
        console.error('❌ Error al leer el estado de PM Blocker:', error.message);
        return { enabled: false, message: DEFAULT_MESSAGE };
    }
}

/**
 * Guarda el estado del sistema PM Blocker de forma segura.
 */
function writeState(enabled, message) {
    try {
        const dataDir = path.dirname(PMBLOCKER_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        const current = readState();
        const payload = {
            enabled: !!enabled,
            message: typeof message === 'string' && message.trim() ? message : current.message
        };
        fs.writeFileSync(PMBLOCKER_PATH, JSON.stringify(payload, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Error al guardar el estado de PM Blocker:', error.message);
    }
}

/**
 * Comando principal para gestionar el bloqueo de mensajes privados (.pmblocker)
 */
async function pmblockerCommand(sock, chatId, message, args) {
    try {
        // 1. Validación de seguridad: Solo el dueño del bot puede cambiar configuraciones globales
        if (!message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando global. Solo el *dueño del bot* puede configurarlo.' 
            }, { quoted: message });
        }

        const argStr = (args || '').trim();
        const [sub, ...rest] = argStr.split(' ');
        const state = readState();
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 2. Mostrar menú de ayuda si no hay argumentos o el comando no es válido
        if (!sub || !['on', 'off', 'status', 'setmsg'].includes(sub.toLowerCase())) {
            const helpMessage = `╭━━━⊱ 🛡️ *PM BLOCKER* ⊱━━━╮
│
│  Configura el bloqueo automático
│  de mensajes directos (DM) al bot.
│
│  ⚙️ *Comandos disponibles:*
│  • *.pmblocker on*       → Activar bloqueo de DM
│  • *.pmblocker off*      → Desactivar bloqueo de DM
│  • *.pmblocker status*   → Ver estado actual
│  • *.pmblocker setmsg*   → Cambiar mensaje de advertencia
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🔒 Protege tu número de spam y consultas no deseadas.`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Configuración global`,
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📢 Únete a mi Canal Oficial',
                            url: channelLink,
                            merchant_url: channelLink
                        })
                    }
                ],
                headerType: 1
            }, { quoted: message });
        }

        // 3. Mostrar estado actual
        if (sub.toLowerCase() === 'status') {
            const statusEmoji = state.enabled ? '🟢' : '🔴';
            const statusText = state.enabled ? 'ACTIVADO' : 'DESACTIVADO';
            
            const statusMessage = `╭━━━⊱ 📊 *ESTADO DEL SISTEMA* ⊱━━━╮
│
│  🛡️ *PM Blocker:* ${statusEmoji} *${statusText}*
│
│  📝 *Mensaje actual:*
│  _${state.message.replace(/\n/g, '\n  _')}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: statusMessage,
                footer: `🤖 ${botName} | Configuración global`,
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📢 Únete a mi Canal Oficial',
                            url: channelLink,
                            merchant_url: channelLink
                        })
                    }
                ],
                headerType: 1
            }, { quoted: message });
        }

        // 4. Configurar mensaje personalizado
        if (sub.toLowerCase() === 'setmsg') {
            const newMsg = rest.join(' ').trim();
            if (!newMsg) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ *Uso incorrecto*\n\nPor favor, proporciona el nuevo mensaje.\n💡 Ejemplo: `.pmblocker setmsg Hola, escribe en los grupos.`' 
                }, { quoted: message });
            }
            writeState(state.enabled, newMsg);
            
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ✅ *MENSAJE ACTUALIZADO* ⊱━━━╮
│
│  El mensaje de advertencia para
│  mensajes privados ha sido cambiado
│  exitosamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Configuración global`,
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📢 Únete a mi Canal Oficial',
                            url: channelLink,
                            merchant_url: channelLink
                        })
                    }
                ],
                headerType: 1
            }, { quoted: message });
        }

        // 5. Activar o Desactivar
        const enable = sub.toLowerCase() === 'on';
        writeState(enable, state.message);

        const actionEmoji = enable ? '✅' : '🔓';
        const actionText = enable ? 'activado' : 'desactivado';
        const actionDesc = enable 
            ? 'El bot ahora bloqueará y rechazará automáticamente los mensajes directos.' 
            : 'El bot ya no bloqueará los mensajes directos.';

        const successMessage = `╭━━━⊱ ⚙️ *CONFIGURACIÓN ACTUALIZADA* ⊱━━━╮
│
│  🛡️ *PM Blocker:* ${actionEmoji} *${actionText.toUpperCase()}*
│
│  📝 *Nota:* ${actionDesc}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: successMessage,
            footer: `🤖 ${botName} | Configuración global`,
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }
            ],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en pmblockerCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al procesar la configuración de PM Blocker. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

module.exports = { pmblockerCommand, readState };