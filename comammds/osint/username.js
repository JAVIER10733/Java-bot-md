/**
 * Java Bot MD - Comando OSINT: Username Search (.username)
 * Realiza una búsqueda de inteligencia sobre un nombre de usuario en plataformas públicas.
 * API utilizada: GitHub API (Gratuita, no requiere API Key para uso básico)
 */
const axios = require('axios');
const { isPremiumUser, sendPremiumLockedMessage } = require('./utils');

const BOT_NAME = global.botname || 'Java Bot MD';

/**
 * Valida el formato de un nombre de usuario (alfanumérico, 3-30 caracteres).
 */
function isValidUsername(username) {
    return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
}

async function usernameSearchCommand(sock, chatId, message, targetUsername) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;

        // 1. Verificar acceso Premium
       if (!(await isPremiumUser(senderId, message.key.fromMe)))  {
            return sendPremiumLockedMessage(sock, chatId, message);
        }

        // 2. Validar entrada
        if (!targetUsername) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🕵️ *USO INCORRECTO* ⊱━━━╮
│
│  Debes proporcionar un nombre de 
│  usuario para realizar la búsqueda.
│
│  💡 *Ejemplos:*
│  • .username mruniquehacker
│  • .username JAVIER10733
│
│  📝 *Formato:* 3-30 caracteres, 
│  solo letras, números, guiones o guiones bajos.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        const cleanUser = targetUsername.trim();
        if (!isValidUsername(cleanUser)) {
            return await sock.sendMessage(chatId, {
                text: `❌ *Formato de usuario inválido.*\n\nAsegúrate de usar solo letras, números, guiones (-) o guiones bajos (_), con una longitud de 3 a 30 caracteres.`,
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🕵️', key: message.key } });

        // 4. Consultar API de GitHub (OSINT real y funcional)
        const response = await axios.get(`https://api.github.com/users/${cleanUser}`, {
            timeout: 10000,
            headers: { 'User-Agent': 'Java-Bot-MD-OSINT' }
        });

        const data = response.data;

        // 5. Formatear y enviar la respuesta
        const name = data.name || 'No especificado';
        const bio = data.bio || 'Sin biografía pública';
        const location = data.location || 'Ubicación oculta';
        const createdAt = new Date(data.created_at).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
        const profileUrl = data.html_url;

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 🕵️ *REPORTE DE USUARIO* ⊱━━━╮
│
│  🔍 *Objetivo:* @${cleanUser}
│  👤 *Nombre:* ${name}
│  📝 *Biografía:* _${bio}_
│  📍 *Ubicación:* ${location}
│
│  📊 *Estadísticas Públicas:*
│  • Repositorios: ${data.public_repos}
│  • Seguidores: ${data.followers}
│  • Siguiendo: ${data.following}
│
│  📅 *Registro:* ${createdAt}
│  🔗 *Perfil:* ${profileUrl}
│
│  ⚠️ *Nota:* Datos obtenidos de fuentes 
│  públicas (OSINT).
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `${BOT_NAME} · OSINT Premium`,
            mentions: [`${cleanUser}@s.whatsapp.net`] // Intenta mencionar si es un número, si no, no afecta
        }, { quoted: message });

        // 6. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en usernameSearchCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        let errorMsg = '❌ Ocurrió un error al buscar el usuario.';
        if (error.response?.status === 404) {
            errorMsg = `🔍 *Usuario no encontrado.*\n\nEl nombre de usuario "_${targetUsername}_" no existe o la cuenta es privada/eliminada.`;
        } else if (error.response?.status === 403) {
            errorMsg = '🚫 *Límite de consultas alcanzado.*\n\nLa API pública ha limitado las búsquedas por ahora. Intenta de nuevo en una hora.';
        }
        
        await sock.sendMessage(chatId, {
            text: errorMsg,
            footer: `${BOT_NAME} · Soporte Técnico`
        }, { quoted: message });
    }
}

module.exports = usernameSearchCommand;