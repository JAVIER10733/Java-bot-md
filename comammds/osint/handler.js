/**
 * Java Bot MD - Enrutador del Módulo OSINT
 * Centraliza y distribuye las solicitudes de comandos de inteligencia.
 * Mantiene el main.js limpio y escalable.
 */

const { 
    phoneInfoCommand, 
    ipLookupCommand, 
    usernameSearchCommand, 
    emailTraceCommand 
} = require('./index');

/**
 * Maneja todos los comandos relacionados con OSINT.
 * @param {object} sock - Instancia del socket de Baileys.
 * @param {string} chatId - ID del chat.
 * @param {object} message - Objeto completo del mensaje.
 * @param {string} userMessage - El texto del comando (ej: ".iplookup 8.8.8.8").
 */
async function handleOsintCommand(sock, chatId, message, userMessage) {
    try {
        // Extraer el comando base y los argumentos
        const args = userMessage.trim().split(/\s+/);
        const command = args[0].toLowerCase();
        const target = args.slice(1).join(' ').trim();

        switch (command) {
            case '.phoneinfo':
                await phoneInfoCommand(sock, chatId, message, target);
                break;

            case '.iplookup':
                await ipLookupCommand(sock, chatId, message, target);
                break;

            case '.username':
                await usernameSearchCommand(sock, chatId, message, target);
                break;

            case '.emailtrace':
                await emailTraceCommand(sock, chatId, message, target);
                break;

            default:
                // Si por alguna razón llega un comando OSINT no reconocido
                await sock.sendMessage(chatId, {
                    text: '❌ Comando OSINT no reconocido. Usa *.help osint* para ver la lista.',
                    footer: 'Java Bot MD · OSINT Premium'
                }, { quoted: message });
                break;
        }
    } catch (error) {
        console.error('❌ Error en el enrutador OSINT:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error interno al procesar la solicitud OSINT.',
            footer: 'Java Bot MD · Soporte Técnico'
        }, { quoted: message });
    }
}

module.exports = handleOsintCommand;