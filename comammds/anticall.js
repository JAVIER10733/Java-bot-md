const fs = require('fs');
const path = require('path');

const ANTICALL_PATH = path.join(__dirname, '../data/anticall.json');

/**
 * Lee el estado actual del sistema Anticall.
 */
function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { enabled: !!data.enabled };
    } catch (error) {
        console.error('❌ Error al leer el estado de Anticall:', error.message);
        return { enabled: false };
    }
}

/**
 * Guarda el estado del sistema Anticall de forma segura.
 */
function writeState(enabled) {
    try {
        const dataDir = path.dirname(ANTICALL_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Error al guardar el estado de Anticall:', error.message);
    }
}

/**
 * Comando principal para gestionar el Anticall (.anticall)
 */
async function anticallCommand(sock, chatId, message, args) {
    try {
        // 1. Validación de seguridad: Solo el dueño del bot puede cambiar configuraciones globales
        if (!message.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando global. Solo el *dueño del bot* puede configurarlo.' 
            }, { quoted: message });
        }

        const state = readState();
        const sub = (args || '').trim().toLowerCase();
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 2. Mostrar menú de ayuda si no hay argumentos o el comando no es válido
        if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
            const helpMessage = `╭━━━⊱ 📵 *ANTICALL* ⊱━━━╮
│
│  Configura el bloqueo y rechazo
│  automático de llamadas entrantes.
│
│  ⚙️ *Comandos disponibles:*
│  • *.anticall on*     → Activar el bloqueo automático
│  • *.anticall off*    → Desactivar el sistema
│  • *.anticall status* → Ver el estado actual
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🛡️ Protege tu número de spam y llamadas no deseadas.`;

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
        if (sub === 'status') {
            const statusEmoji = state.enabled ? '🟢' : '🔴';
            const statusText = state.enabled ? 'ACTIVADO' : 'DESACTIVADO';
            
            const statusMessage = `╭━━━⊱ 📊 *ESTADO DEL SISTEMA* ⊱━━━╮
│
│  📵 *Anticall:* ${statusEmoji} *${statusText}*
│
│  ${state.enabled 
                    ? 'El bot rechazará y bloqueará automáticamente cualquier llamada entrante.' 
                    : 'El bot permitirá la recepción de llamadas normales.'}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

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

        // 4. Activar o Desactivar
        const enable = sub === 'on';
        writeState(enable);

        const actionEmoji = enable ? '✅' : '🔓';
        const actionText = enable ? 'activado' : 'desactivado';
        const actionDesc = enable 
            ? 'El bot ahora rechazará y bloqueará automáticamente las llamadas entrantes.' 
            : 'El bot ya no bloqueará las llamadas entrantes.';

        const successMessage = `╭━━━⊱ ⚙️ *CONFIGURACIÓN ACTUALIZADA* ⊱━━━╮
│
│  📵 *Anticall:* ${actionEmoji} *${actionText.toUpperCase()}*
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
        console.error('❌ Error en anticallCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al procesar la configuración de Anticall. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

module.exports = { anticallCommand, readState };