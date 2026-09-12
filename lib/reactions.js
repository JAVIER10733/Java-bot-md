/**
 * Java Bot MD - Sistema de Auto-Reacciones
 * Gestiona las reacciones automáticas a los comandos con emojis dinámicos y persistencia segura.
 */
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE_PATH = path.join(DATA_DIR, 'userGroupData.json');
const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

// Conjunto dinámico de emojis para hacer las reacciones más vivas y naturales
const COMMAND_EMOJIS = ['✅', '🔥', '⚡', '🚀', '💯', '🎯', '🤖', '✨', '🌟', '💎', '👑', '🎉'];

/**
 * Asegura que el directorio de datos exista.
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Carga el estado de las auto-reacciones de forma segura.
 * @returns {boolean} Estado actual de las auto-reacciones.
 */
function loadAutoReactionState() {
    try {
        ensureDataDir();
        if (fs.existsSync(DATA_FILE_PATH)) {
            const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
            const data = JSON.parse(rawData);
            return Boolean(data.autoReaction);
        }
    } catch (error) {
        console.error('❌ Error al cargar el estado de auto-reacciones:', error.message);
    }
    return false; // Valor por defecto seguro
}

/**
 * Guarda el estado de las auto-reacciones de forma segura (asíncrono para no bloquear).
 * @param {boolean} state - Nuevo estado (true o false).
 */
async function saveAutoReactionState(state) {
    try {
        ensureDataDir();
        let data = {};
        
        if (fs.existsSync(DATA_FILE_PATH)) {
            const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
            data = JSON.parse(rawData) || {};
        }
        
        data.autoReaction = state;
        await fsPromises.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Error al guardar el estado de auto-reacciones:', error.message);
    }
}

// Estado inicial cargado al iniciar el módulo
let isAutoReactionEnabled = loadAutoReactionState();

/**
 * Obtiene un emoji aleatorio del conjunto.
 * @returns {string} Un emoji aleatorio.
 */
function getRandomEmoji() {
    const randomIndex = Math.floor(Math.random() * COMMAND_EMOJIS.length);
    return COMMAND_EMOJIS[randomIndex];
}

/**
 * Añade una reacción al mensaje del comando si la función está activada.
 * @param {object} sock - Instancia del socket de Baileys.
 * @param {object} message - Objeto del mensaje.
 */
async function addCommandReaction(sock, message) {
    try {
        if (!isAutoReactionEnabled || !message?.key?.id) return;
        
        const emoji = getRandomEmoji();
        await sock.sendMessage(message.key.remoteJid, {
            react: {
                text: emoji,
                key: message.key
            }
        });
    } catch (error) {
        // Fallo silencioso para no saturar la consola con errores de reacciones (ej. mensaje ya eliminado)
    }
}

/**
 * Maneja el comando de configuración de auto-reacciones (.areact).
 * @param {object} sock - Instancia del socket de Baileys.
 * @param {string} chatId - ID del chat.
 * @param {object} message - Objeto del mensaje.
 * @param {boolean} isOwner - Si el remitente es el dueño o sudo.
 */
async function handleAreactCommand(sock, chatId, message, isOwner) {
    try {
        if (!isOwner) {
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ❌ *ACCESO DENEGADO* ⊱━━━╮
│
│  Este es un comando de configuración 
│  global. Solo el *dueño del bot* 
│  puede usarlo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Configuración`,
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

        const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = rawText.trim().split(' ');
        const action = args[1]?.toLowerCase();

        if (action === 'on') {
            isAutoReactionEnabled = true;
            await saveAutoReactionState(true);
            
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ✅ *AUTO-REACCIONES ACTIVADAS* ⊱━━━╮
│
│  🤖 El bot ahora reaccionará 
│  automáticamente a los comandos 
│  con emojis aleatorios.
│
│  ✨ ¡La experiencia de usuario 
│  es ahora más dinámica!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Configuración`,
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
            
        } else if (action === 'off') {
            isAutoReactionEnabled = false;
            await saveAutoReactionState(false);
            
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ 🚫 *AUTO-REACCIONES DESACTIVADAS* ⊱━━━╮
│
│  El bot ya no reaccionará 
│  automáticamente a los comandos.
│
│  ⚙️ El chat se mantendrá más limpio.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Configuración`,
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
            
        } else {
            const currentState = isAutoReactionEnabled ? '✅ *Activadas*' : '❌ *Desactivadas*';
            
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ⚡ *GESTIÓN DE REACCIONES* ⊱━━━╮
│
│  Estado actual: ${currentState}
│
│  ⚙️ *Comandos disponibles:*
│  • *.areact on*  → Activar reacciones
│  • *.areact off* → Desactivar reacciones
│
│  💡 Las reacciones usan emojis 
│  aleatorios para mayor naturalidad.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Configuración`,
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
        console.error('❌ Error en handleAreactCommand:', error.message);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al controlar las auto-reacciones. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

module.exports = {
    addCommandReaction,
    handleAreactCommand
};