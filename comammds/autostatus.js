const fs = require('fs');
const path = require('path');

// Ruta para almacenar la configuración de AutoStatus
const configPath = path.join(__dirname, '../data/autoStatus.json');

/**
 * Obtiene la configuración de forma segura, creando el archivo si no existe.
 */
function getConfig() {
    try {
        const dataDir = path.dirname(configPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, JSON.stringify({ enabled: false, reactOn: false }, null, 2), 'utf8');
        }
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
        console.error('❌ Error al leer la configuración de AutoStatus:', error);
        return { enabled: false, reactOn: false }; // Fallback seguro
    }
}

/**
 * Guarda la configuración de forma segura.
 */
function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Error al guardar la configuración de AutoStatus:', error);
    }
}

/**
 * Comando principal para gestionar el AutoStatus (.autostatus)
 */
async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        // 1. Validación de seguridad: Solo el dueño del bot
        if (!msg.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando global. Solo el *dueño del bot* puede configurarlo.' 
            }, { quoted: msg });
        }

        const config = getConfig();
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 2. Mostrar menú de ayuda si no hay argumentos
        if (!args || args.length === 0) {
            const viewStatus = config.enabled ? '🟢 Activado' : '🔴 Desactivado';
            const reactStatus = config.reactOn ? '🟢 Activado' : '🔴 Desactivado';

            const helpMessage = `╭━━━⊱ 👁️ *AUTO ESTADO* ⊱━━━╮
│
│  Configura la visualización y reacción
│  automática a los estados de WhatsApp.
│
│  📊 *Estado actual:*
│  • Ver estados: ${viewStatus}
│  • Reaccionar: ${reactStatus}
│
│  ⚙️ *Comandos disponibles:*
│  • *.autostatus on*       → Activar visualización
│  • *.autostatus off*      → Desactivar visualización
│  • *.autostatus react on* → Activar reacciones (💚)
│  • *.autostatus react off*→ Desactivar reacciones
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
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
            }, { quoted: msg });
        }

        // 3. Procesar comandos
        const command = args[0].toLowerCase();
        
        if (command === 'on') {
            config.enabled = true;
            saveConfig(config);
            return await sendSuccessMessage(sock, chatId, msg, '✅ *Visualización automática activada.*\n\nEl bot ahora verá todos los estados de tus contactos automáticamente.', botName, channelLink);
        } 
        
        if (command === 'off') {
            config.enabled = false;
            saveConfig(config);
            return await sendSuccessMessage(sock, chatId, msg, '🔓 *Visualización automática desactivada.*\n\nEl bot ya no verá los estados automáticamente.', botName, channelLink);
        } 
        
        if (command === 'react') {
            if (!args[1]) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ Por favor, especifica *on* u *off*.\n\n💡 Ejemplo: `.autostatus react on`' 
                }, { quoted: msg });
            }
            
            const reactAction = args[1].toLowerCase();
            if (reactAction === 'on') {
                config.reactOn = true;
                saveConfig(config);
                return await sendSuccessMessage(sock, chatId, msg, '💫 *Reacciones a estados activadas.*\n\nEl bot ahora reaccionará con 💚 a los estados que vea.', botName, channelLink);
            } 
            
            if (reactAction === 'off') {
                config.reactOn = false;
                saveConfig(config);
                return await sendSuccessMessage(sock, chatId, msg, '🔓 *Reacciones a estados desactivadas.*\n\nEl bot solo verá los estados, pero no reaccionará.', botName, channelLink);
            }
        }

        // 4. Comando no reconocido
        await sock.sendMessage(chatId, { 
            text: '❌ *Comando no válido.*\n\nEscribe *.autostatus* sin argumentos para ver el menú de ayuda.' 
        }, { quoted: msg });

    } catch (error) {
        console.error('❌ Error en autoStatusCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al procesar la configuración. Inténtalo de nuevo.' 
        }, { quoted: msg });
    }
}

/**
 * Función auxiliar para enviar mensajes de éxito con el botón del canal.
 */
async function sendSuccessMessage(sock, chatId, msg, text, botName, channelLink) {
    await sock.sendMessage(chatId, {
        text: `╭━━━⊱ ⚙️ *CONFIGURACIÓN ACTUALIZADA* ⊱━━━╮\n│\n│  ${text}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
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
    }, { quoted: msg });
}

/**
 * Verifica si la visualización automática de estados está habilitada.
 */
function isAutoStatusEnabled() {
    return getConfig().enabled;
}

/**
 * Verifica si las reacciones a estados están habilitadas.
 */
function isStatusReactionEnabled() {
    return getConfig().reactOn;
}

/**
 * Reacciona a un estado usando el método correcto de Baileys.
 */
async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled()) return;

        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: '💚'
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
    } catch (error) {
        // Solo registrar errores críticos, ignorar errores menores de reacción
        if (!error.message?.includes('rate-overlimit')) {
            console.error('❌ Error al reaccionar al estado:', error.message);
        }
    }
}

/**
 * Maneja la visualización y reacción automática a los estados entrantes.
 */
async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) return;

        // Pequeño retraso para evitar límites de velocidad (rate limits) de WhatsApp
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Extraer la clave del mensaje de estado, sin importar el formato del evento
        let statusKey = null;
        
        if (status.messages && status.messages.length > 0 && status.messages[0].key.remoteJid === 'status@broadcast') {
            statusKey = status.messages[0].key;
        } else if (status.key && status.key.remoteJid === 'status@broadcast') {
            statusKey = status.key;
        } else if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            statusKey = status.reaction.key;
        }

        if (!statusKey) return;

        try {
            // 1. Marcar como visto
            await sock.readMessages([statusKey]);
            
            // 2. Reaccionar si está habilitado
            await reactToStatus(sock, statusKey);
            
        } catch (err) {
            // Manejo robusto de límites de velocidad (Rate Limit)
            if (err.message?.includes('rate-overlimit') || err.message?.includes('429')) {
                console.log('⚠️ Límite de velocidad alcanzado en estados. Esperando 2 segundos...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                await sock.readMessages([statusKey]).catch(() => {});
            } else {
                throw err;
            }
        }

    } catch (error) {
        console.error('❌ Error en el manejador de AutoStatus:', error.message);
    }
}

module.exports = {
    autoStatusCommand,
    isAutoStatusEnabled,
    isStatusReactionEnabled,
    handleStatusUpdate
};