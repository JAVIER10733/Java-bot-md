const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

const DATA_DIR = path.join(__dirname, '..', 'data');
const WARNINGS_PATH = path.join(DATA_DIR, 'warnings.json');
const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Inicializa el directorio y el archivo de advertencias de forma segura.
 */
function initializeWarningsFile() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(WARNINGS_PATH)) {
            fs.writeFileSync(WARNINGS_PATH, JSON.stringify({}), 'utf8');
        }
    } catch (error) {
        console.error('❌ Error al inicializar warnings.json:', error.message);
    }
}

/**
 * Java Bot MD - Comando para Advertir Usuarios (.warn)
 * Registra infracciones y expulsa automáticamente al alcanzar el límite.
 */
async function warnCommand(sock, chatId, senderId, mentionedJids, message) {
    try {
        // 1. Inicializar archivos y validar que sea un grupo
        initializeWarningsFile();
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        // 2. Validar permisos de administrador
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
        
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *PERMISOS INSUFICIENTES* ⊱━━━╮
│
│  Necesito ser *administrador del grupo* 
│  para poder registrar advertencias y 
│  ejecutar expulsiones.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ACCESO DENEGADO* ⊱━━━╮
│
│  Solo los *administradores del grupo* 
│  (o el dueño del bot) pueden emitir 
│  advertencias.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        // 3. Extraer el usuario objetivo (Soporta menciones, respuestas y mensajes efímeros)
        let userToWarn = null;
        if (mentionedJids && mentionedJids.length > 0) {
            userToWarn = mentionedJids[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = message.message.extendedTextMessage.contextInfo.participant;
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToWarn) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ Por favor, menciona al usuario o responde a su mensaje para advertirle.\n💡 *Ejemplo:* .warn @usuario`,
            }, { quoted: message });
        }

        // Protección: Evitar que el bot se advierta o expulse a sí mismo
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (userToWarn === botId) {
            return await sock.sendMessage(chatId, { text: '🤖 No puedo advertirme a mí mismo. ¡Soy inocente!' }, { quoted: message });
        }

        // 4. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '⚠️', key: message.key } });

        // 5. Leer y actualizar el archivo de advertencias de forma segura
        let warnings = {};
        try {
            const rawData = fs.readFileSync(WARNINGS_PATH, 'utf8');
            warnings = rawData.trim() ? JSON.parse(rawData) : {};
        } catch (error) {
            console.warn('⚠️ Archivo warnings.json corrupto o vacío, reiniciando...');
            warnings = {};
        }

        if (!warnings[chatId]) warnings[chatId] = {};
        if (!warnings[chatId][userToWarn]) warnings[chatId][userToWarn] = 0;
        
        warnings[chatId][userToWarn]++;
        const currentCount = warnings[chatId][userToWarn];
        
        try {
            fs.writeFileSync(WARNINGS_PATH, JSON.stringify(warnings, null, 2), 'utf8');
        } catch (error) {
            throw new Error('No se pudo guardar el archivo de advertencias.');
        }

        const userName = userToWarn.split('@')[0];
        const modName = senderId.split('@')[0];

        // 6. Lógica de Expulsión Automática (3 advertencias)
        if (currentCount >= 3) {
            await sock.sendMessage(chatId, { react: { text: '🚫', key: message.key } });
            
            try {
                await sock.groupParticipantsUpdate(chatId, [userToWarn], "remove");
                
                // Resetear contador tras expulsión
                delete warnings[chatId][userToWarn];
                fs.writeFileSync(WARNINGS_PATH, JSON.stringify(warnings, null, 2), 'utf8');

                const kickMessage = `╭━━━⊱ 🚫 *EXPULSIÓN AUTOMÁTICA* ⊱━━━╮
│
│  👤 *Expulsado:* @${userName}
│  🚨 *Motivo:* Acumuló 3 advertencias.
│  👑 *Moderador:* @${modName}
│
│  📝 El usuario ha sido eliminado del 
│  grupo por infringir las normas 
│  repetidamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

                await sock.sendMessage(chatId, {
                    text: kickMessage,
                    mentions: [userToWarn, senderId],
                    footer: `🤖 ${BOT_NAME} | Moderación segura`,
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
                
                return; // Terminar ejecución tras expulsar
            } catch (kickError) {
                console.error('❌ Error al expulsar:', kickError.message);
                throw new Error('No se pudo ejecutar la expulsión automática. Verifica mis permisos.');
            }
        }

        // 7. Mensaje de Advertencia Estándar (si es < 3)
        const warningMessage = `╭━━━⊱ ⚠️ *ADVERTENCIA EMITIDA* ⊱━━━╮
│
│  👤 *Usuario:* @${userName}
│  🚨 *Advertencias:* ${currentCount}/3
│  👑 *Moderador:* @${modName}
│
│  📝 *Motivo:* Infracción de las normas 
│  del grupo. La próxima será expulsión.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: warningMessage,
            mentions: [userToWarn, senderId],
            footer: `🤖 ${BOT_NAME} | Moderación segura`,
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

        // 8. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en warnCommand:', error);
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al procesar la 
│  advertencia.
│
│  💡 *Posible causa:* El bot perdió 
│  permisos de administrador o el 
│  archivo de datos está bloqueado.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Soporte técnico`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Reportar en el Canal',
                    url: CHANNEL_LINK,
                    merchant_url: CHANNEL_LINK
                })
            }],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = warnCommand;