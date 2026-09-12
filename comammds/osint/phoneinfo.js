/**
 * Java Bot MD - Comando OSINT: Phone Info (.phoneinfo)
 * Obtiene información pública sobre un número de teléfono.
 */
const { isPremiumUser, sendPremiumLockedMessage } = require('./utils');

const BOT_NAME = global.botname || 'Java Bot MD';

async function phoneInfoCommand(sock, chatId, message, targetNumber) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;

        // 1. Verificar acceso Premium
      if (!(await isPremiumUser(senderId, message.key.fromMe))) {
            return sendPremiumLockedMessage(sock, chatId, message);
        }

        // 2. Validar que se haya proporcionado un número
        if (!targetNumber) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 📱 *USO INCORRECTO* ⊱━━━╮
│
│  Debes proporcionar un número de 
│  teléfono para realizar la búsqueda.
│
│  💡 *Ejemplo:* .phoneinfo 593999999999
│  💡 *Nota:* Incluye el código de país 
│     sin el símbolo '+'.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        // 3. Validación básica del formato del número (solo dígitos, 7 a 15 caracteres)
        const cleanNumber = targetNumber.replace(/\D/g, '');
        if (cleanNumber.length < 7 || cleanNumber.length > 15) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Formato de número inválido.*\n\nPor favor, ingresa un número válido con código de país (ej: 593999999999).',
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        // 4. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '📡', key: message.key } });

        // =================================================================
        // 🚀 AQUÍ VA TU INTEGRACIÓN CON LA API REAL (Ej: Numverify, Twilio)
        // =================================================================
        // const axios = require('axios');
        // const apiResponse = await axios.get(`https://api.api-ninjas.com/v1/validatephone?number=${cleanNumber}`, {
        //     headers: { 'X-Api-Key': 'TU_API_KEY_AQUI' }
        // });
        // const data = apiResponse.data;
        // =================================================================

        // Simulación de respuesta (Placeholder profesional)
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simula tiempo de carga

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 📱 *REPORTE DE TELÉFONO* ⊱━━━╮
│
│  🔍 *Objetivo:* +${cleanNumber}
│  🌍 *País:* [Pendiente de API]
│  📶 *Operador:* [Pendiente de API]
│  📍 *Región:* [Pendiente de API]
│  ✅ *Válido:* [Pendiente de API]
│
│  ⚠️ *Nota:* Este es un mensaje de 
│  vista previa. La conexión con la 
│  API de OSINT se activará en la 
│  próxima actualización del sistema.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `${BOT_NAME} · OSINT Premium`
        }, { quoted: message });

        // 5. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en phoneInfoCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error al procesar la solicitud de OSINT. Inténtalo de nuevo más tarde.',
            footer: `${BOT_NAME} · Soporte Técnico`
        }, { quoted: message });
    }
}

module.exports = phoneInfoCommand;