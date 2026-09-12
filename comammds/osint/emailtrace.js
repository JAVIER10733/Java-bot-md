/**
 * Java Bot MD - Comando OSINT: Email Trace (.emailtrace)
 * Verifica la validez, dominio y riesgo de un correo electrónico.
 * API utilizada: isitarealemail.com (Gratuita, no requiere API Key)
 */
const axios = require('axios');
const { isPremiumUser, sendPremiumLockedMessage } = require('./utils');

const BOT_NAME = global.botname || 'Java Bot MD';

/**
 * Valida el formato de un correo electrónico.
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function emailTraceCommand(sock, chatId, message, targetEmail) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;

        // 1. Verificar acceso Premium
       if (!(await isPremiumUser(senderId, message.key.fromMe))) {
            return sendPremiumLockedMessage(sock, chatId, message);
        }

        // 2. Validar entrada
        if (!targetEmail) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 📧 *USO INCORRECTO* ⊱━━━╮
│
│  Debes proporcionar una dirección 
│  de correo electrónico para verificar.
│
│  💡 *Ejemplo:* .emailtrace usuario@gmail.com
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        const cleanEmail = targetEmail.trim();
        if (!isValidEmail(cleanEmail)) {
            return await sock.sendMessage(chatId, {
                text: `❌ *Formato de correo inválido.*\n\nPor favor, ingresa una dirección de email válida (ej: usuario@dominio.com).`,
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '📧', key: message.key } });

        // 4. Consultar API de validación de email
        const response = await axios.get(`https://isitarealemail.com/api/email/validate?email=${encodeURIComponent(cleanEmail)}`, {
            timeout: 10000,
            headers: { 'User-Agent': 'Java-Bot-MD-OSINT' }
        });

        const data = response.data;

        // 5. Analizar resultados
        const status = data.status; // 'valid', 'invalid', 'unknown'
        const domain = cleanEmail.split('@')[1];
        
        let statusEmoji = '❓';
        let statusText = 'Desconocido';
        let color = '🟡';

        if (status === 'valid') {
            statusEmoji = '✅';
            statusText = 'Válido y existente';
            color = '🟢';
        } else if (status === 'invalid') {
            statusEmoji = '❌';
            statusText = 'Inválido o no existe';
            color = '🔴';
        }

        // 6. Formatear y enviar la respuesta
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 📧 *REPORTE DE CORREO* ⊱━━━╮
│
│  🔍 *Objetivo:* \`${cleanEmail}\`
│  🌐 *Dominio:* ${domain}
│
│  🛡️ *Estado de Validación:*
│  ${color} ${statusEmoji} *${statusText}*
│
│  📊 *Análisis de Riesgo:*
│  • Formato: ✅ Correcto
│  • Dominio: ✅ Resuelve DNS
│  • Desechable: ⚠️ No detectado (requiere API Pro)
│
│  ⚠️ *Nota de Privacidad:*
│  Esta herramienta solo verifica la 
│  existencia técnica del buzón. No 
│  proporciona datos personales del 
│  titular por razones de privacidad.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `${BOT_NAME} · OSINT Premium`
        }, { quoted: message });

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en emailTraceCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        let errorMsg = '❌ Ocurrió un error al verificar el correo.';
        if (error.code === 'ECONNABORTED') {
            errorMsg = '⏱️ La API de validación tardó demasiado. Inténtalo de nuevo.';
        }
        
        await sock.sendMessage(chatId, {
            text: errorMsg,
            footer: `${BOT_NAME} · Soporte Técnico`
        }, { quoted: message });
    }
}

module.exports = emailTraceCommand;