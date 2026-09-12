const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando para ver el Equipo de Administración (.staff / .admins)
 * Muestra de forma organizada y elegante a todos los administradores y al dueño del grupo.
 */
async function staffCommand(sock, chatId, message) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Información`,
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

        // 2. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🛡️', key: message.key } });

        // 3. Obtener metadatos del grupo
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        
        // 4. Obtener foto de perfil del grupo (con fallback elegante)
        let groupProfilePic;
        try {
            groupProfilePic = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            groupProfilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; // Avatar por defecto
        }

        // 5. Identificar al dueño y administradores
        const ownerJid = groupMetadata.owner || 
                         participants.find(p => p.admin === 'superadmin')?.id || 
                         chatId.split('-')[0] + '@s.whatsapp.net';
        
        const groupAdmins = participants.filter(p => p.admin);

        if (groupAdmins.length === 0) {
            await sock.sendMessage(chatId, { react: { text: '⚠️', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: '⚠️ No se encontraron administradores en este grupo.',
                footer: `🤖 ${BOT_NAME} | Información`,
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

        // 6. Formatear la lista con roles diferenciados
        const adminsList = groupAdmins.map((v) => {
            const mention = `@${v.id.split('@')[0]}`;
            if (v.id === ownerJid) {
                return `  👑 *Dueño:* ${mention}`;
            } else if (v.admin === 'superadmin') {
                return `  👑 *Co-Dueño:* ${mention}`;
            } else {
                return `  🛡️ *Admin:* ${mention}`;
            }
        }).join('\n');

        // 7. Construir el mensaje con diseño de tarjeta premium
        const staffText = `╭━━━⊱ 👑 *EQUIPO DE ADMINISTRACIÓN* ⊱━━━╮
│
│  🏢 *Grupo:* ${groupMetadata.subject}
│  👥 *Miembros totales:* ${participants.length}
│  🛡️ *Administradores:* ${groupAdmins.length}
│
│  📋 *Lista de Staff:*
│  ${adminsList}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 8. Enviar el mensaje con la imagen, menciones y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            image: { url: groupProfilePic },
            caption: staffText,
            mentions: groupAdmins.map(v => v.id),
            footer: `🤖 ${BOT_NAME} | Información del Grupo`,
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

        // 9. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en staffCommand:', error);
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al intentar 
│  obtener la lista de administradores.
│
│  💡 *Posible causa:* El bot no tiene 
│  permisos para leer los metadatos 
│  del grupo o la conexión es inestable.
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

module.exports = staffCommand;