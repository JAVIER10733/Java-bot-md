const fetch = require('node-fetch');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando de Tarjeta de Simp (.simp)
 * Genera el clásico meme "Simp Card" con la foto de perfil de un usuario para diversión del grupo.
 */
async function simpCommand(sock, chatId, quotedMsg, mentionedJid, sender, message) {
    try {
        // 1. Determinar el usuario objetivo (soporta menciones, respuestas y remitente)
        let who = null;
        
        if (quotedMsg?.sender) {
            who = quotedMsg.sender;
        } else if (mentionedJid && mentionedJid.length > 0) {
            who = mentionedJid[0];
        } else {
            who = sender;
        }

        // 2. Reacción de procesamiento
        if (message?.key) {
            await sock.sendMessage(chatId, { react: { text: '🤡', key: message.key } });
        }

        // 3. Obtener foto de perfil (con fallback elegante)
        let avatarUrl;
        try {
            avatarUrl = await sock.profilePictureUrl(who, 'image');
        } catch (error) {
            // Avatar por defecto si el usuario no tiene foto o la API falla
            avatarUrl = 'https://i.imgur.com/2wzGhpF.jpeg'; 
        }

        // 4. Petición a la API con AbortController (timeout de 15s para evitar congelamientos)
        const apiUrl = `https://some-random-api.com/canvas/misc/simpcard?avatar=${encodeURIComponent(avatarUrl)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        let response;
        try {
            response = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw new Error('Tiempo de espera agotado o API no disponible');
        }
        
        if (!response.ok) {
            throw new Error(`La API respondió con estado: ${response.status}`);
        }

        const imageBuffer = await response.buffer();

        // 5. Caption con diseño de tarjeta premium
        const userName = who.split('@')[0];
        const caption = `╭━━━⊱ 🤡 *TARJETA DE SIMP* ⊱━━━╮
│
│  👤 *Usuario:* @${userName}
│  💖 *Nivel de Simp:* Máximo
│
│  😂 ¡Todos tenemos nuestros momentos 
│  de debilidad! No te lo tomes en serio.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 6. Enviar la imagen con menciones y el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: caption,
            mentions: [who],
            footer: `🤖 ${BOT_NAME} | Diversión`,
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

        // 7. Reacción de éxito
        if (message?.key) {
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        }

    } catch (error) {
        console.error('❌ Error en simpCommand:', error.message);
        
        if (message?.key) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        }
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE GENERACIÓN* ⊱━━━╮
│
│  No se pudo generar la tarjeta de simp 
│  en este momento.
│
│  💡 *Posibles causas:*
│  • El servidor de imágenes está saturado.
│  • El usuario no tiene foto de perfil y 
│    el fallback falló.
│  • Tiempo de espera agotado.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
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

module.exports = { simpCommand };