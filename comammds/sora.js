const axios = require('axios');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando de Generación de Video con IA (.sora)
 * Convierte descripciones de texto en videos impresionantes usando modelos de IA.
 */
async function soraCommand(sock, chatId, message) {
    try {
        // 1. Extraer y limpiar el texto base
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() || '';

        const used = (rawText || '').split(/\s+/)[0] || '.sora';
        let prompt = rawText.slice(used.length).trim();

        // 2. Fallback: Si no hay prompt directo, buscar en el mensaje citado (soporta efímeros)
        if (!prompt) {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                           message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            prompt = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        }

        // 3. Validar que exista un prompt
        if (!prompt) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎬 *GENERADOR DE VIDEO AI* ⊱━━━╮
│
│  Convierte tus ideas en videos 
│  impresionantes usando Inteligencia 
│  Artificial de última generación.
│
│  💡 *Uso:* .sora <tu descripción>
│  💡 *Ejemplo:* .sora un gato astronauta 
│    flotando en el espacio, 4k, cinemático
│
│  ⚠️ *Nota:* La generación puede tardar 
│  unos segundos. Sé específico para 
│  obtener mejores resultados.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Inteligencia Artificial`,
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

        // 4. Reacción de inicio de proceso
        await sock.sendMessage(chatId, { react: { text: '🎬', key: message.key } });

        // 5. Consulta a la API con timeout extendido (60s es ideal para video)
        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl, { 
            timeout: 60000, 
            headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
        });

        // 6. Extraer la URL del video de forma flexible
        const videoUrl = data?.videoUrl || data?.result || data?.data?.videoUrl || data?.url;
        
        if (!videoUrl) {
            throw new Error('La API no devolvió un enlace de video válido.');
        }

        // 7. Reacción de procesamiento final
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // 8. Preparar caption elegante (truncar si es muy largo)
        const cleanPrompt = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;

        // 9. Enviar el video con diseño premium y botón CTA
        await sock.sendMessage(chatId, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `╭━━━⊱ ✅ *VIDEO GENERADO* ⊱━━━╮
│
│  🎬 *Prompt:* _"${cleanPrompt}"_
│  🤖 *Motor:* AI Text-to-Video
│
│  ✨ ¡Tu video ha sido creado 
│  exitosamente!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Inteligencia Artificial`,
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

        // 10. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en soraCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE GENERACIÓN* ⊱━━━╮
│
│  No se pudo generar el video en este 
│  momento.
│
│  💡 *Posibles causas:*
│  • El prompt es demasiado complejo o 
│    viola las políticas de contenido.
│  • El servidor de IA está temporalmente 
│    saturado.
│  • Tiempo de espera agotado (>60s).
│
│  Intenta con una descripción más 
│  sencilla o vuelve a intentarlo más 
│  tarde.
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

module.exports = soraCommand;