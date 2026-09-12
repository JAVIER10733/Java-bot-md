const settings = require('../settings');
const { addSudo, removeSudo, getSudoList } = require('../lib/index');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Extrae el JID de un usuario mencionado o un número escrito en el mensaje.
 */
function extractMentionedJid(message) {
    // 1. Buscar en menciones directas (soporta mensajes normales y efímeros)
    const contextInfo = message.message?.extendedTextMessage?.contextInfo || 
                        message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;
    
    const mentioned = contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned[0];
    
    // 2. Buscar si es una respuesta a un usuario
    if (contextInfo?.participant) {
        return contextInfo.participant;
    }

    // 3. Buscar un número de teléfono en el texto (7 a 15 dígitos)
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const match = text.match(/\b(\d{7,15})\b/);
    if (match) return `${match[1]}@s.whatsapp.net`;
    
    return null;
}

/**
 * Java Bot MD - Comando de Gestión de Usuarios Sudo (.sudo)
 * Permite al dueño del bot añadir, eliminar o listar usuarios con privilegios de administrador.
 */
async function sudoCommand(sock, chatId, message) {
    try {
        const senderJid = message.key.participant || message.key.remoteJid;
        const ownerJid = (settings.ownerNumber || '').replace(/\D/g, '') + '@s.whatsapp.net';
        const isOwner = message.key.fromMe || senderJid === ownerJid;

        const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = rawText.trim().split(' ').slice(1);
        const sub = (args[0] || '').toLowerCase();

        // 1. Validar que sea el dueño del bot
        if (!isOwner) {
            await sock.sendMessage(chatId, { react: { text: '🔒', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ACCESO DENEGADO* ⊱━━━╮
│
│  Este es un comando de alto nivel.
│  Solo el *dueño del bot* puede 
│  gestionar la lista de usuarios Sudo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Seguridad`,
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

        // 2. Validar subcomando
        if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 👑 *GESTIÓN DE SUDO* ⊱━━━╮
│
│  Administra los privilegios de 
│  administrador del bot.
│
│  ⚙️ *Comandos disponibles:*
│  • *.sudo add* <@usuario o número>
│  • *.sudo del* <@usuario o número>
│  • *.sudo list*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Seguridad`,
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

        // 3. Subcomando: LISTAR
        if (sub === 'list') {
            await sock.sendMessage(chatId, { react: { text: '📋', key: message.key } });
            const list = await getSudoList();
            
            if (list.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ 📋 *LISTA DE SUDO* ⊱━━━╮
│
│  ℹ️ No hay usuarios Sudo 
│  configurados actualmente.
│
│  Solo el dueño del bot tiene 
│  privilegios totales.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${BOT_NAME} | Seguridad`,
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

            const listText = list.map((j, i) => `  👑 *${i + 1}.* @${j.split('@')[0]}`).join('\n');
            
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 👑 *LISTA DE SUDO* ⊱━━━╮
│
│  Total de usuarios con privilegios: *${list.length}*
│
${listText}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                mentions: list,
                footer: `🤖 ${BOT_NAME} | Seguridad`,
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

        // 4. Validar objetivo para ADD/DEL
        const targetJid = extractMentionedJid(message);
        if (!targetJid) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ Por favor, menciona a un usuario o proporciona un número de teléfono válido.\n💡 *Ejemplo:* .sudo add @usuario`,
            }, { quoted: message });
        }

        // 5. Subcomando: AÑADIR
        if (sub === 'add') {
            await sock.sendMessage(chatId, { react: { text: '➕', key: message.key } });
            
            if (targetJid === ownerJid) {
                return await sock.sendMessage(chatId, { text: 'ℹ️ El dueño del bot ya tiene todos los privilegios por defecto.' }, { quoted: message });
            }

            const ok = await addSudo(targetJid);
            const userName = targetJid.split('@')[0];

            if (ok) {
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ ✅ *SUDO AÑADIDO* ⊱━━━╮
│
│  👤 *Usuario:* @${userName}
│  🔑 *Privilegio:* Concedido
│
│  📝 Este usuario ahora puede usar 
│  comandos de propietario del bot.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    mentions: [targetJid],
                    footer: `🤖 ${BOT_NAME} | Seguridad`,
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
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return await sock.sendMessage(chatId, { text: '❌ No se pudo añadir al usuario. Es posible que ya sea Sudo.' }, { quoted: message });
            }
        }

        // 6. Subcomando: ELIMINAR
        if (sub === 'del' || sub === 'remove') {
            await sock.sendMessage(chatId, { react: { text: '➖', key: message.key } });
            
            if (targetJid === ownerJid) {
                return await sock.sendMessage(chatId, { text: '⚠️ El dueño del bot no puede ser eliminado de la lista Sudo.' }, { quoted: message });
            }

            const ok = await removeSudo(targetJid);
            const userName = targetJid.split('@')[0];

            if (ok) {
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ ✅ *SUDO ELIMINADO* ⊱━━━╮
│
│  👤 *Usuario:* @${userName}
│  🔒 *Privilegio:* Revocado
│
│  📝 Este usuario ya no tiene 
│  acceso a comandos de propietario.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    mentions: [targetJid],
                    footer: `🤖 ${BOT_NAME} | Seguridad`,
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
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return await sock.sendMessage(chatId, { text: '❌ No se pudo eliminar al usuario. Es posible que no esté en la lista Sudo.' }, { quoted: message });
            }
        }

    } catch (error) {
        console.error('❌ Error en sudoCommand:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al procesar 
│  la solicitud de gestión Sudo.
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

module.exports = sudoCommand;