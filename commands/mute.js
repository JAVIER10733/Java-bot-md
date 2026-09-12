const isAdmin = require('../lib/isAdmin');

/**
 * Java Bot MD - Comando para silenciar el grupo (.mute)
 * Permite a los administradores restringir los mensajes solo a los admins, con opción de temporizador.
 */
async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Administración`,
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

        // 2. Validar permisos de administrador
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
        
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *PERMISOS INSUFICIENTES* ⊱━━━╮
│
│  Necesito ser *administrador del grupo* 
│  para poder silenciar a los miembros.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Administración`,
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

        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ACCESO DENEGADO* ⊱━━━╮
│
│  Solo los *administradores del grupo* 
│  (o el dueño del bot) pueden usar este 
│  comando.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Administración`,
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

        // 3. Ejecutar el silenciamiento del grupo
        await sock.groupSettingUpdate(chatId, 'announcement');

        // 4. Lógica de temporizador y mensaje de éxito
        if (durationInMinutes !== undefined && durationInMinutes > 0) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            
            // Calcular la hora exacta de reactivación (Zona horaria de Ecuador)
            const unmuteTime = new Date(Date.now() + durationInMilliseconds);
            const formattedUnmuteTime = unmuteTime.toLocaleString('es-EC', {
                timeZone: 'America/Guayaquil',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            const successMessage = `╭━━━⊱ 🔇 *GRUPO SILENCIADO* ⊱━━━╮
│
│  🔒 *Estado:* Solo administradores
│  ⏱️ *Duración:* ${durationInMinutes} minuto${durationInMinutes > 1 ? 's' : ''}
│  🕒 *Reactivación:* ${formattedUnmuteTime}
│
│  ✅ El grupo ha sido silenciado 
│  temporalmente con éxito.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            await sock.sendMessage(chatId, {
                text: successMessage,
                footer: `🤖 ${botName} | Administración segura`,
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

            // Programar la reactivación automática
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { 
                        text: `🔓 *El grupo ha sido reactivado.*\n\nYa todos los miembros pueden enviar mensajes nuevamente.` 
                    });
                } catch (unmuteError) {
                    console.error('❌ Error al reactivar el grupo automáticamente:', unmuteError.message);
                    // Si falla, es probable que el bot ya no sea admin, no hay necesidad de spam de error
                }
            }, durationInMilliseconds);

        } else {
            // Silenciamiento indefinido
            const successMessage = `╭━━━⊱ 🔇 *GRUPO SILENCIADO* ⊱━━━╮
│
│  🔒 *Estado:* Solo administradores
│  ⏱️ *Duración:* Indefinida
│
│  ✅ El grupo ha sido silenciado. 
│  Usa *.unmute* para reactivarlo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            await sock.sendMessage(chatId, {
                text: successMessage,
                footer: `🤖 ${botName} | Administración segura`,
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

    } catch (error) {
        console.error('❌ Error en muteCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SISTEMA* ⊱━━━╮
│
│  Ocurrió un problema al intentar 
│  silenciar el grupo.
│
│  💡 *Posible causa:* El bot perdió 
│  permisos de administrador.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
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

module.exports = muteCommand;