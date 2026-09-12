const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Obtiene la URL de la imagen de forma robusta (Citada, Propia o Foto de Perfil).
 */
async function getQuotedOrOwnImageUrl(sock, message) {
    try {
        // 1. Imagen citada (prioridad alta, soporta mensajes efímeros)
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                       message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (quoted?.imageMessage) {
            const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            return await uploadImage(Buffer.concat(chunks));
        }

        // 2. Imagen en el mensaje actual
        if (message.message?.imageMessage) {
            const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            return await uploadImage(Buffer.concat(chunks));
        }

        // 3. Determinar el JID objetivo (Mención, Respuesta o Remitente)
        let targetJid = message.key.participant || message.key.remoteJid;
        const ctx = message.message?.extendedTextMessage?.contextInfo || 
                    message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;
                    
        if (ctx?.mentionedJid?.length > 0) {
            targetJid = ctx.mentionedJid[0];
        } else if (ctx?.participant) {
            targetJid = ctx.participant;
        }

        // 4. Fallback a la foto de perfil
        try {
            return await sock.profilePictureUrl(targetJid, 'image');
        } catch {
            return 'https://i.imgur.com/2wzGhpF.png'; // Avatar por defecto
        }
    } catch (error) {
        console.error('⚠️ Error obteniendo URL de imagen:', error.message);
        return 'https://i.imgur.com/2wzGhpF.png';
    }
}

/**
 * Helper para procesar endpoints simples de avatar sin repetir código.
 */
async function processSimpleCanvas(endpoint, sock, chatId, message, category = 'misc') {
    const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
    const baseUrl = category === 'overlay' 
        ? `https://api.some-random-api.com/canvas/overlay/${endpoint}`
        : `https://api.some-random-api.com/canvas/misc/${endpoint}`;
        
    const url = `${baseUrl}?avatar=${encodeURIComponent(avatarUrl)}`;
    
    const response = await axios.get(url, { 
        responseType: 'arraybuffer', 
        timeout: 15000 // 15 segundos de límite
    });
    
    await sock.sendMessage(chatId, { 
        image: Buffer.from(response.data) 
    }, { quoted: message });
}

/**
 * Comando principal para efectos de imagen (.misc)
 */
async function miscCommand(sock, chatId, message, args) {
    try {
        const sub = (args[0] || '').toLowerCase();
        const rest = args.slice(1);

        // --- MENÚ DE AYUDA ---
        if (!sub) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎨 *EFECTOS DE IMAGEN* ⊱━━━╮
│
│  Aplica efectos divertidos a tu foto
│  de perfil o a la imagen que respondas.
│
│  💡 *Efectos simples:*
│  .misc heart | horny | circle | lgbt
│  .misc lolice | simpcard | tonikawa
│  .misc comrade | gay | glass | jail
│  .misc passed | triggered | lied
│
│  💡 *Efectos con texto:*
│  .misc its-so-stupid <texto>
│  .misc oogway <frase>
│  .misc oogway2 <frase>
│
│  💡 *Efectos con formato:*
│  .misc namecard <usuario>|<cumpleaños>|<desc>
│  .misc tweet <nombre>|<user>|<comentario>|<tema>
│  .misc youtube-comment <usuario>|<comentario>
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Creatividad`,
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

        // Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });

        // --- PROCESAMIENTO DE COMANDOS ---
        switch (sub) {
            // Efectos simples de avatar (Misc)
            case 'heart':
            case 'horny':
            case 'circle':
            case 'lgbt':
            case 'lied':
            case 'lolice':
            case 'simpcard':
            case 'tonikawa':
                await processSimpleCanvas(sub, sock, chatId, message, 'misc');
                break;

            // Efectos simples de avatar (Overlay)
            case 'comrade':
            case 'gay':
            case 'glass':
            case 'jail':
            case 'passed':
            case 'triggered':
                await processSimpleCanvas(sub, sock, chatId, message, 'overlay');
                break;

            // Efectos con texto personalizado
            case 'its-so-stupid': {
                const text = rest.join(' ').trim();
                if (!text) throw new Error('Falta el texto. Uso: `.misc its-so-stupid <texto>`');
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const url = `https://api.some-random-api.com/canvas/misc/its-so-stupid?dog=${encodeURIComponent(text)}&avatar=${encodeURIComponent(avatarUrl)}`;
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                await sock.sendMessage(chatId, { image: Buffer.from(res.data) }, { quoted: message });
                break;
            }

            case 'oogway':
            case 'oogway2': {
                const quote = rest.join(' ').trim();
                if (!quote) throw new Error(`Falta la frase. Uso: \`.misc ${sub} <frase>\``);
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const url = `https://api.some-random-api.com/canvas/misc/${sub}?quote=${encodeURIComponent(quote)}&avatar=${encodeURIComponent(avatarUrl)}`;
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                await sock.sendMessage(chatId, { image: Buffer.from(res.data) }, { quoted: message });
                break;
            }

            // Efectos con formato múltiple (pipe |)
            case 'namecard': {
                const [username, birthday, description] = rest.join(' ').split('|').map(s => (s || '').trim());
                if (!username || !birthday) throw new Error('Faltan datos. Uso: `.misc namecard <usuario>|<cumpleaños>|<descripción(opcional)>`');
                
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const params = new URLSearchParams({ username, birthday, avatar: avatarUrl });
                if (description) params.append('description', description);
                
                const url = `https://api.some-random-api.com/canvas/misc/namecard?${params.toString()}`;
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                await sock.sendMessage(chatId, { image: Buffer.from(res.data) }, { quoted: message });
                break;
            }

            case 'tweet': {
                const [displayname, username, comment, theme] = rest.join(' ').split('|').map(s => (s || '').trim());
                if (!displayname || !username || !comment) throw new Error('Faltan datos. Uso: `.misc tweet <nombre>|<usuario>|<comentario>|<tema(opcional)>`');
                
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const params = new URLSearchParams({ displayname, username, comment, avatar: avatarUrl });
                if (theme) params.append('theme', theme);
                
                const url = `https://api.some-random-api.com/canvas/misc/tweet?${params.toString()}`;
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                await sock.sendMessage(chatId, { image: Buffer.from(res.data) }, { quoted: message });
                break;
            }

            case 'youtube-comment': {
                const [username, comment] = rest.join(' ').split('|').map(s => (s || '').trim());
                if (!username || !comment) throw new Error('Faltan datos. Uso: `.misc youtube-comment <usuario>|<comentario>`');
                
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const params = new URLSearchParams({ username, comment, avatar: avatarUrl });
                
                const url = `https://api.some-random-api.com/canvas/misc/youtube-comment?${params.toString()}`;
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                await sock.sendMessage(chatId, { image: Buffer.from(res.data) }, { quoted: message });
                break;
            }

            default:
                throw new Error(`Efecto "${sub}" no reconocido. Escribe \`.misc\` para ver la lista.`);
        }

        // Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en miscCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE PROCESAMIENTO* ⊱━━━╮
│
│  ${error.message || 'No se pudo generar la imagen.'}
│
│  💡 *Consejos:*
│  • Verifica que la sintaxis sea correcta.
│  • Asegúrate de responder a una imagen o 
│    que el usuario tenga foto de perfil.
│  • La API puede estar temporalmente saturada.
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

/**
 * Función independiente para .heart (por compatibilidad con main.js)
 */
async function handleHeart(sock, chatId, message) {
    try {
        await processSimpleCanvas('heart', sock, chatId, message, 'misc');
    } catch (error) {
        console.error('❌ Error en handleHeart:', error.message);
        await sock.sendMessage(chatId, { text: '❌ No se pudo crear la imagen del corazón. Inténtalo más tarde.' }, { quoted: message });
    }
}

module.exports = { miscCommand, handleHeart };