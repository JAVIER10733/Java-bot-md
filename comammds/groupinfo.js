/**
 * Java Bot MD - Comando de Información del Grupo (.groupinfo)
 * Muestra detalles completos, administradores y estadísticas del grupo actual.
 */
async function groupInfoCommand(sock, chatId, msg) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Obtener metadatos del grupo
        const groupMetadata = await sock.groupMetadata(chatId);
        
        // 2. Obtener foto de perfil del grupo (con fallback elegante)
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg'; // Imagen por defecto si no hay foto
        }

        // 3. Procesar participantes y administradores
        const participants = groupMetadata.participants || [];
        const groupAdmins = participants.filter(p => p.admin);
        
        // Formatear lista de admins de forma limpia
        const listAdmin = groupAdmins.length > 0 
            ? groupAdmins.map((v, i) => `   • @${v.id.split('@')[0]}`).join('\n')
            : '   • Ninguno';
        
        // 4. Identificar al creador/propietario del grupo de forma segura
        const owner = groupMetadata.owner || 
                      groupAdmins.find(p => p.admin === 'superadmin')?.id || 
                      chatId.split('-')[0] + '@s.whatsapp.net';

        // 5. Procesar la descripción (con límite de caracteres para evitar desbordamiento)
        const rawDesc = groupMetadata.desc?.toString() || 'Sin descripción disponible.';
        const cleanDesc = rawDesc.length > 150 ? rawDesc.substring(0, 150) + '...' : rawDesc;

        // 6. Construir el mensaje con diseño de tarjeta premium
        const infoText = `╭━━━⊱ 📊 *INFORMACIÓN DEL GRUPO* ⊱━━━╮
│
│  🏷️ *Nombre:* ${groupMetadata.subject}
│  🆔 *ID:* ${groupMetadata.id}
│  👥 *Miembros:* ${participants.length}
│  👑 *Creador:* @${owner.split('@')[0]}
│
│  🛡️ *Administradores (${groupAdmins.length}):*
│  ${listAdmin}
│
│  📝 *Descripción:*
│  _${cleanDesc}_
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 7. Enviar el mensaje con imagen, menciones y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: infoText,
            mentions: [...new Set([...groupAdmins.map(v => v.id), owner])], // Eliminar duplicados si el owner es admin
            footer: `🤖 ${botName} | Información del grupo`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1 // Necesario para mostrar botones junto con una imagen
        }, { quoted: msg });

    } catch (error) {
        console.error('❌ Error en groupInfoCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { 
            text: `❌ *Error al obtener información*\n\nAsegúrate de que este comando se esté usando dentro de un grupo y de que el bot tenga permisos para leer los metadatos.`,
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
        }, { quoted: msg });
    }
}

module.exports = groupInfoCommand;