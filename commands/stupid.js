const fetch = require('node-fetch');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando de Meme "It's So Stupid" (.stupid)
 * Genera el clásico meme con la foto de perfil del usuario y un texto personalizado.
 */
async function stupidCommand(sock, chatId, quotedMsg, mentionedJid, sender, args) {
    try {
        // 1. Determinar el usuario objetivo (soporta mensajes normales y efímeros)
        let who = null;
        
        if (quotedMsg) {
            who = quotedMsg.sender;
        } else if (mentionedJid && mentionedJid[0]) {
            who = mentionedJid[0];
        } else if (sender) {
            who = sender;
        } else {
            who = chatId; // Fallback
        }

        // 2. Obtener el texto personalizado (por defecto "im stupid")
        let text = args && args.length > 0 ? args.join(' ') : 'im stupid';
        
        // Validar longitud del texto (la API falla con textos muy largos)
        if (text.length > 30) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ *Texto demasiado largo.*\n\nEl meme solo soporta máximo 30 caracteres. Tu texto tiene ${text.length}.`,
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
            }, { quoted: quotedMsg ? undefined : undefined });
        }

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🤪', key: { remoteJid: chatId, id: 'dummy' } } }).catch(() => {});

        // 4. Obtener foto de perfil con fallback elegante
        let avatarUrl;
        try {
            avatarUrl = await sock.profilePictureUrl(who, 'image');
        } catch (error) {
            console.warn('⚠️ No se pudo obtener foto de perfil, usando avatar por defecto.');
            avatarUrl = 'https://i.imgur.com/2wzGhpF.jpeg'; // Avatar por defecto
        }

        // 5. Generar el meme con timeout de seguridad (15 segundos)
        const apiUrl = `https://some-random-api.com/canvas/misc/its-so-stupid?avatar=${encodeURIComponent(avatarUrl)}&dog=${encodeURIComponent(text)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        let response;
        try {
            response = await fetch(apiUrl, { 
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            clearTimeout(timeoutId);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw new Error(fetchError.name === 'AbortError' 
                ? 'El servidor tardó demasiado en responder.' 
                : 'No se pudo conectar con el servidor de memes.');
        }
        
        if (!response.ok) {
            throw new Error(`La API respondió con estado: ${response.status}`);
        }

        // 6. Obtener el buffer de la imagen
        const imageBuffer = await response.buffer();
        const userName = who.split('@')[0];

        // 7. Enviar el meme con diseño premium
        const caption = `╭━━━⊱ 🤪 *MEME GENERADO* ⊱━━━╮
│
│  👤 *Protagonista:* @${userName}
│  💭 *Pensamiento:* _"${text}"_
│
│  😂 ¡Es broma! Solo es diversión.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: caption,
            mentions: [who],
            footer: `🤖 ${BOT_NAME} | Diversión y Memes`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: CHANNEL_LINK,
                    merchant_url: CHANNEL_LINK
                })
            }],
            headerType: 1
        });

        // 8. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: { remoteJid: chatId, id: 'dummy' } } }).catch(() => {});

    } catch (error) {
        console.error('❌ Error en stupidCommand:', error.message);
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE GENERACIÓN* ⊱━━━╮
│
│  No se pudo crear el meme en este 
│  momento.
│
│  💡 *Posibles causas:*
│  • La API de memes está saturada.
│  • El usuario no tiene foto de perfil
│    y el fallback falló.
│  • El texto contiene caracteres no 
│    soportados.
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
        });
    }
}

module.exports = { stupidCommand };