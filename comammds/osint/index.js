/**
 * Java Bot MD - Módulo OSINT (Open Source Intelligence)
 * Copyright (c) 2026 Professor
 * 
 * ⚠️ ADVERTENCIA: Estos comandos son de carácter PREMIUM / DE PAGO.
 * Este módulo incluye la lógica de validación de licencias para 
 * restringir el acceso solo a usuarios con suscripción activa.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

// Ruta al archivo que almacenará los JIDs de los usuarios premium
// (Asegúrate de que esta ruta coincida con tu estructura de carpetas)
const PREMIUM_USERS_FILE = path.join(__dirname, '../../data/premiumUsers.json');

/**
 * Asegura que el archivo de usuarios premium exista.
 */
async function ensurePremiumFile() {
    const dataDir = path.dirname(PREMIUM_USERS_FILE);
    if (!fsSync.existsSync(dataDir)) {
        fsSync.mkdirSync(dataDir, { recursive: true });
    }
    if (!fsSync.existsSync(PREMIUM_USERS_FILE)) {
        await fs.writeFile(PREMIUM_USERS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
}

/**
 * Verifica si un usuario tiene acceso Premium a las herramientas OSINT.
 * @param {string} userId - El JID del usuario (ej: 593999999999@s.whatsapp.net)
 * @returns {Promise<boolean>} True si es premium, False en caso contrario.
 */
async function isPremiumUser(userId) {
    try {
        await ensurePremiumFile();
        const data = await fs.readFile(PREMIUM_USERS_FILE, 'utf8');
        const premiumList = JSON.parse(data);
        
        // Verifica si el usuario está en la lista (puedes expandir esto para checar fechas de expiración)
        return premiumList.includes(userId);
    } catch (error) {
        console.error('❌ Error al verificar estado premium:', error.message);
        return false; // Por seguridad, denegar acceso si hay un error de lectura
    }
}

/**
 * Mensaje estándar de "Acceso Denegado" para comandos de pago.
 */
async function sendPremiumLockedMessage(sock, chatId, message) {
    return sock.sendMessage(chatId, {
        text: `╭━━━⊱ 🔒 *ACCESO DENEGADO* ⊱━━━╮
│
│  Este comando es parte del paquete 
│  *OSINT PREMIUM* de ${BOT_NAME}.
│
│  💎 *Beneficios del Plan Premium:*
│  • Búsqueda de información por teléfono
│  • Rastreo geográfico de direcciones IP
│  • Búsqueda de usuarios en redes sociales
│  • Verificación de correos electrónicos
│  • Soporte prioritario 24/7
│
│  📩 *Para adquirir tu licencia:*
│  Contacta al propietario del bot o 
│  revisa la información en nuestro canal.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
        footer: `${BOT_NAME} · OSINT Premium`,
        buttons: [{
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: '📢 Info de Precios en el Canal',
                url: CHANNEL_LINK,
                merchant_url: CHANNEL_LINK
            })
        }],
        headerType: 1
    }, { quoted: message });
}

// =========================================================================
// COMANDOS OSINT (PLACEHOLDERS LISTOS PARA DESARROLLO)
// =========================================================================

/**
 * .phoneinfo <número>
 */
async function phoneInfoCommand(sock, chatId, message, targetNumber) {
    const senderId = message.key.participant || message.key.remoteJid;
    if (!(await isPremiumUser(senderId))) return sendPremiumLockedMessage(sock, chatId, message);

    await sock.sendMessage(chatId, { react: { text: '📱', key: message.key } });
    
    // TODO: Aquí iría la lógica real de la API de OSINT (ej: Numverify, Twilio, etc.)
    await sock.sendMessage(chatId, {
        text: `╭━━━⊱ 📱 *INFO DE TELÉFONO* ⊱━━━╮
│
│  🔍 *Objetivo:* ${targetNumber}
│  ⏳ *Estado:* Procesando solicitud...
│
│  *(Esta es una vista previa. La integración 
│  con la API real se completará en la v4.1)*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
        footer: `${BOT_NAME} · OSINT Premium`
    }, { quoted: message });
}

/**
 * .iplookup <dirección IP>
 */
async function ipLookupCommand(sock, chatId, message, targetIP) {
    const senderId = message.key.participant || message.key.remoteJid;
    if (!(await isPremiumUser(senderId))) return sendPremiumLockedMessage(sock, chatId, message);

    await sock.sendMessage(chatId, { react: { text: '🌐', key: message.key } });

    // TODO: Integrar con API como ipapi.co o ipgeolocation.io
    await sock.sendMessage(chatId, {
        text: `╭━━━⊱ 🌐 *IP LOOKUP* ⊱━━━╮
│
│  🔍 *Objetivo:* ${targetIP}
│  ⏳ *Estado:* Rastreando ubicación...
│
│  *(Integración con API de geolocalización 
│  pendiente de activación)*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
        footer: `${BOT_NAME} · OSINT Premium`
    }, { quoted: message });
}

/**
 * .username <usuario>
 */
async function usernameSearchCommand(sock, chatId, message, targetUsername) {
    const senderId = message.key.participant || message.key.remoteJid;
    if (!(await isPremiumUser(senderId))) return sendPremiumLockedMessage(sock, chatId, message);

    await sock.sendMessage(chatId, { react: { text: '🕵️', key: message.key } });

    // TODO: Integrar con API tipo Sherlock o Namechk
    await sock.sendMessage(chatId, {
        text: `╭━━━⊱ 🕵️ *BÚSQUEDA DE USUARIO* ⊱━━━╮
│
│  🔍 *Objetivo:* @${targetUsername}
│  ⏳ *Estado:* Escaneando redes sociales...
│
│  *(Integración de escaneo multi-plataforma 
│  pendiente de activación)*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
        footer: `${BOT_NAME} · OSINT Premium`,
        mentions: [`${targetUsername}@s.whatsapp.net`] // Intenta mencionar si es número
    }, { quoted: message });
}

/**
 * .emailtrace <correo>
 */
async function emailTraceCommand(sock, chatId, message, targetEmail) {
    const senderId = message.key.participant || message.key.remoteJid;
    if (!(await isPremiumUser(senderId))) return sendPremiumLockedMessage(sock, chatId, message);

    await sock.sendMessage(chatId, { react: { text: '📧', key: message.key } });

    // TODO: Integrar con Hunter.io o HaveIBeenPwned (con precaución)
    await sock.sendMessage(chatId, {
        text: `╭━━━⊱ 📧 *RASTREO DE CORREO* ⊱━━━╮
│
│  🔍 *Objetivo:* ${targetEmail}
│  ⏳ *Estado:* Verificando filtraciones y 
│     registros públicos...
│
│  *(Integración de verificación de brechas 
│  de seguridad pendiente de activación)*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
        footer: `${BOT_NAME} · OSINT Premium`
    }, { quoted: message });
}

// =========================================================================
// EXPORTACIONES
// =========================================================================

module.exports = {
    isPremiumUser,
    phoneInfoCommand,
    ipLookupCommand,
    usernameSearchCommand,
    emailTraceCommand
};