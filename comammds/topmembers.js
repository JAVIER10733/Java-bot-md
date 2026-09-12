const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE_PATH = path.join(DATA_DIR, 'messageCount.json');
const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Asegura que el directorio de datos exista de forma segura.
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Carga el conteo de mensajes de forma segura, previniendo crasheos por archivos corruptos.
 */
function loadMessageCounts() {
    try {
        ensureDataDir();
        if (!fs.existsSync(DATA_FILE_PATH)) {
            fs.writeFileSync(DATA_FILE_PATH, JSON.stringify({}), 'utf8');
            return {};
        }
        const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('❌ Error al cargar messageCount.json:', error.message);
        return {}; // Fallback seguro para evitar que el bot deje de contar
    }
}

/**
 * Guarda el conteo de mensajes de forma segura.
 */
function saveMessageCounts(messageCounts) {
    try {
        ensureDataDir();
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(messageCounts, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Error al guardar messageCount.json:', error.message);
    }
}

/**
 * Incrementa el contador de mensajes de un usuario en un grupo.
 * (Silencia errores para no bloquear el flujo normal de mensajes del bot).
 */
function incrementMessageCount(groupId, userId) {
    try {
        const messageCounts = loadMessageCounts();
        if (!messageCounts[groupId]) {
            messageCounts[groupId] = {};
        }
        if (!messageCounts[groupId][userId]) {
            messageCounts[groupId][userId] = 0;
        }
        messageCounts[groupId][userId] += 1;
        saveMessageCounts(messageCounts);
    } catch (error) {
        // Silenciar errores de escritura para no interrumpir la experiencia del usuario
        console.error('⚠️ Error al incrementar contador de mensajes:', error.message);
    }
}

/**
 * Java Bot MD - Comando para ver los miembros más activos (.top / .topmembers)
 */
async function topMembers(sock, chatId, message, isGroup) {
    try {
        const botName = BOT_NAME;
        const channelLink = CHANNEL_LINK;

        // 1. Validar que sea un grupo
        if (!isGroup) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Estadísticas`,
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
        }

        // 2. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🏆', key: message.key } });

        // 3. Obtener y procesar datos
        const messageCounts = loadMessageCounts();
        const groupCounts = messageCounts[chatId] || {};

        const sortedMembers = Object.entries(groupCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5); // Top 5

        // 4. Manejar caso sin actividad
        if (sortedMembers.length === 0) {
            await sock.sendMessage(chatId, { react: { text: '⚠️', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 📊 *SIN ACTIVIDAD* ⊱━━━╮
│
│  Aún no se ha registrado actividad 
│  de mensajes en este grupo.
│
│  💡 *Sigue participando* para 
│  aparecer en el ranking.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Estadísticas`,
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
        }

        // 5. Construir el ranking con medallas
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        let rankingText = '';
        let totalGroupMessages = 0;

        sortedMembers.forEach(([userId, count], index) => {
            const medal = medals[index] || '🔹';
            const userName = userId.split('@')[0];
            rankingText += `│  ${medal} *@${userName}* → ${count} mensajes\n`;
            totalGroupMessages += count;
        });

        const successMessage = `╭━━━⊱ 🏆 *TOP 5 MIEMBROS ACTIVOS* ⊱━━━╮
│
│  📊 *Total de mensajes registrados:* ${totalGroupMessages}
│
${rankingText}│
│  🎉 ¡Felicidades a los miembros más 
│  participativos del grupo!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 6. Enviar el ranking con menciones reales y botón CTA
        await sock.sendMessage(chatId, {
            text: successMessage,
            mentions: sortedMembers.map(([userId]) => userId),
            footer: `🤖 ${botName} | Estadísticas`,
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

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en topMembers:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        const botName = BOT_NAME;
        const channelLink = CHANNEL_LINK;

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al intentar 
│  obtener las estadísticas del grupo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Soporte técnico`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Reportar en el Canal',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = { incrementMessageCount, topMembers };