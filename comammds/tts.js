const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando de Texto a Voz (.tts / .voz)
 * Convierte texto en audio natural utilizando la tecnología de Google TTS.
 */
async function ttsCommand(sock, chatId, message) {
    let tempFilePath = '';
    
    try {
        // 1. Extraer el texto del mensaje
        const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const cleanText = rawText.replace(/^\.?(tts|voz)\s*/i, '').trim();

        // 2. Validar que haya texto
        if (!cleanText) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎙️ *TEXTO A VOZ (TTS)* ⊱━━━╮
│
│  Convierte cualquier texto en un 
│  mensaje de voz natural y claro.
│
│  💡 *Uso:* .tts <tu texto>
│  💡 *Ejemplo:* .tts Hola, ¿cómo estás?
│  💡 *Otros idiomas:* .tts en Hello world
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Utilidades`,
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

        // 3. Detectar idioma automáticamente (por defecto 'es')
        const args = cleanText.split(' ');
        const supportedLangs = ['es', 'en', 'pt', 'fr', 'it', 'de', 'ja', 'ko', 'zh', 'ru', 'ar', 'hi'];
        let language = 'es';
        let textToSpeak = cleanText;

        if (args.length > 1 && supportedLangs.includes(args[0].toLowerCase())) {
            language = args[0].toLowerCase();
            textToSpeak = args.slice(1).join(' ');
        }

        // 4. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🔊', key: message.key } });

        // 5. Preparar directorio temporal y archivo
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        tempFilePath = path.join(tempDir, `tts-${Date.now()}.mp3`);

        // 6. Generar el audio (envuelto en Promesa para async/await limpio)
        const gtts = new gTTS(textToSpeak, language);
        await new Promise((resolve, reject) => {
            gtts.save(tempFilePath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 7. Enviar el audio generado
        await sock.sendMessage(chatId, {
            audio: { url: tempFilePath },
            mimetype: 'audio/mpeg',
            ptt: true, // true para que parezca una nota de voz real de WhatsApp
            caption: `╭━━━⊱ ✅ *AUDIO GENERADO* ⊱━━━╮
│
│  🗣️ *Idioma:* ${language.toUpperCase()}
│  📝 *Texto:* _"${textToSpeak.length > 50 ? textToSpeak.substring(0, 50) + '...' : textToSpeak}"_
│
│  🔊 ¡Tu mensaje de voz está listo!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Utilidades`,
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
        console.error('❌ Error en ttsCommand:', error.message);
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE GENERACIÓN* ⊱━━━╮
│
│  No se pudo convertir el texto a voz.
│
│  💡 *Posibles causas:*
│  • El texto es demasiado largo.
│  • El idioma seleccionado no es válido.
│  • Error de conexión con los servidores 
│    de Google TTS.
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
    } finally {
        // 9. Limpieza segura del archivo temporal
        if (tempFilePath) {
            try {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            } catch (err) {
                console.warn('⚠️ No se pudo eliminar el archivo temporal de TTS:', err.message);
            }
        }
    }
}

module.exports = ttsCommand;