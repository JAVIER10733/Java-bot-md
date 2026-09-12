const axios = require('axios');

/**
 * Java Bot MD - Comando de Efecto Wasted (.wasted)
 * Aplica el clásico efecto de muerte de GTA V a la foto de perfil de un usuario.
 */
async function wastedCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Extraer el usuario objetivo (Mención, Respuesta o Mensaje Efímero)
        let userToWaste = null;
        
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToWaste = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWaste = message.message.extendedTextMessage.contextInfo.participant;
        } else if (message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWaste = message.message.ephemeralMessage.message.extendedTextMessage.contextInfo.participant;
        }

        // 2. Si no se proporciona usuario, mostrar ayuda con diseño premium
        if (!userToWaste) {
            const helpMessage = `╭━━━⊱ 💀 *EFECTO WASTED (GTA V)* ⊱━━━╮
│
│  Aplica el clásico efecto de muerte 
│  de Grand Theft Auto V a la foto 
│  de perfil de un usuario.
│
│  💡 *Uso:* .wasted <mención o respuesta>
│  💡 *Ejemplo:* Responde a un mensaje
│  o menciona al usuario con @.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Diversión y Memes`,
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

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '💀', key: message.key } });

        // 4. Obtener la foto de perfil del usuario (con fallback elegante)
        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(userToWaste, 'image');
        } catch {
            // Imagen de respaldo de alta calidad si no tiene foto o es privada
            profilePic = 'https://i.imgur.com/2wzGhpF.jpeg';
        }

        // 5. Obtener la imagen con el efecto Wasted desde la API (con timeout)
        const apiUrl = `https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePic)}`;
        
        const wastedResponse = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            timeout: 15000 // 15 segundos de límite
        });

        const userName = userToWaste.split('@')[0];

        // 6. Construir el caption con diseño premium
        const captionMessage = `╭━━━⊱ ⚰️ *WASTED* ⊱━━━╮
│
│  💀 *@${userName}* ha sido eliminado.
│
│  🎮 _"Rest in pieces..."_
│  🩸 Misión fallida. ¡Inténtalo de 
│  nuevo en tu próxima vida!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 7. Enviar la imagen con el efecto, menciones y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            image: Buffer.from(wastedResponse.data),
            caption: captionMessage,
            mentions: [userToWaste],
            footer: `🤖 ${botName} | Diversión y Memes`,
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

        // 8. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en wastedCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE PROCESAMIENTO* ⊱━━━╮
│
│  No se pudo generar la imagen con 
│  el efecto Wasted.
│
│  💡 *Posibles causas:*
│  • La API de imágenes está saturada.
│  • El usuario no tiene foto de perfil
│    y el fallback falló.
│
│  Intenta de nuevo en unos segundos.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
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

module.exports = wastedCommand;