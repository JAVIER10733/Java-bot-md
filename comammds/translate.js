const fetch = require('node-fetch');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando de Traducción Universal (.translate / .trt)
 * Traduce texto a más de 100 idiomas usando un sistema de 3 APIs en cascada para máxima fiabilidad.
 */
async function handleTranslateCommand(sock, chatId, message, match) {
    try {
        const botName = BOT_NAME;
        const channelLink = CHANNEL_LINK;

        // 1. Indicador de escritura
        await sock.sendPresenceUpdate('composing', chatId);

        let textToTranslate = '';
        let lang = '';

        // 2. Extraer texto (Soporta mensajes normales y efímeros)
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                       message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (quoted) {
            textToTranslate = quoted.conversation || 
                              quoted.extendedTextMessage?.text || 
                              quoted.imageMessage?.caption || 
                              quoted.videoMessage?.caption || '';
            lang = match.trim();
        } else {
            const args = match.trim().split(' ');
            if (args.length < 2) {
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ 🌐 *TRADUCTOR UNIVERSAL* ⊱━━━╮
│
│  Traduce cualquier texto o mensaje 
│  a más de 100 idiomas al instante.
│
│  💡 *Uso (con respuesta):*
│  .trt <código_idioma>
│  (Ej: Responde a un mensaje con .trt en)
│
│  💡 *Uso (directo):*
│  .trt <texto> <código_idioma>
│  (Ej: .trt Hello world en)
│
│  🌍 *Códigos populares:*
│  es (Español) | en (Inglés) | fr (Francés)
│  pt (Portugués) | ja (Japonés) | ko (Coreano)
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${botName} | Utilidades`,
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
            lang = args.pop();
            textToTranslate = args.join(' ');
        }

        if (!textToTranslate) {
            return await sock.sendMessage(chatId, {
                text: '❌ No se encontró texto para traducir. Por favor, responde a un mensaje o escribe el texto.',
                footer: `🤖 ${botName} | Utilidades`,
                buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: channelLink, merchant_url: channelLink }) }],
                headerType: 1
            }, { quoted: message });
        }

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🌐', key: message.key } });

        let translatedText = null;
        const encodedText = encodeURIComponent(textToTranslate);

        // Helper para peticiones con timeout (evita que el bot se congele)
        const fetchWithTimeout = async (url, timeoutMs = 5000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(id);
                return res;
            } catch (err) {
                clearTimeout(id);
                throw err;
            }
        };

        // 4. Sistema de 3 APIs en cascada para máxima fiabilidad
        
        // API 1: Google Translate (No oficial, pero muy rápida)
        try {
            const res = await fetchWithTimeout(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodedText}`);
            if (res.ok) {
                const data = await res.json();
                if (data?.[0]?.[0]?.[0]) translatedText = data[0][0][0];
            }
        } catch {}

        // API 2: MyMemory (Excelente respaldo)
        if (!translatedText) {
            try {
                const res = await fetchWithTimeout(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=auto|${lang}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.responseData?.translatedText) translatedText = data.responseData.translatedText;
                }
            } catch {}
        }

        // API 3: Dreaded (Último recurso)
        if (!translatedText) {
            try {
                const res = await fetchWithTimeout(`https://api.dreaded.site/api/translate?text=${encodedText}&lang=${lang}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.translated) translatedText = data.translated;
                }
            } catch {}
        }

        // 5. Validar resultado
        if (!translatedText) {
            throw new Error('Todos los servidores de traducción fallaron o el idioma no es válido.');
        }

        // 6. Enviar traducción con diseño premium
        const cleanOriginal = textToTranslate.length > 100 ? textToTranslate.substring(0, 100) + '...' : textToTranslate;
        
        const successMessage = `╭━━━⊱ 🌐 *TRADUCCIÓN EXITOSA* ⊱━━━╮
│
│  🗣️ *Idioma destino:* ${lang.toUpperCase()}
│  📝 *Original:* _"${cleanOriginal}"_
│
│  ✅ *Traducción:*
│  ${translatedText}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: successMessage,
            footer: `🤖 ${botName} | Utilidades`,
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
        await sock.sendPresenceUpdate('paused', chatId);

    } catch (error) {
        console.error('❌ Error en handleTranslateCommand:', error.message);
        await sock.sendPresenceUpdate('paused', chatId);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        const botName = BOT_NAME;
        const channelLink = CHANNEL_LINK;

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE TRADUCCIÓN* ⊱━━━╮
│
│  No se pudo traducir el texto en este 
│  momento.
│
│  💡 *Posibles causas:*
│  • El código de idioma es inválido.
│  • Todos los servidores de traducción 
│    están temporalmente saturados.
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

module.exports = { handleTranslateCommand };