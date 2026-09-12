const axios = require('axios');

/**
 * Java Bot MD - Comando de Generación de Imágenes (.imagine / .flux)
 * Crea imágenes de alta calidad a partir de descripciones de texto usando Inteligencia Artificial.
 */
async function imagineCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Extraer el prompt de forma robusta (soporta .imagine, .flux, .dalle)
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const imagePrompt = text.replace(/^\.?(imagine|flux|dalle)\s*/i, '').trim();

        // 2. Validar que haya una descripción
        if (!imagePrompt || imagePrompt.length < 3) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎨 *GENERADOR DE IMÁGENES* ⊱━━━╮
│
│  Crea imágenes impresionantes con
│  Inteligencia Artificial a partir de
│  tus descripciones.
│
│  💡 *Uso:* .imagine <tu descripción>
│  💡 *Ejemplo:* .imagine un gato astronauta
│  en el espacio, estilo cyberpunk
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Creatividad IA`,
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

        // 3. Reacción de procesamiento para feedback inmediato
        await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });

        // 4. Mejorar el prompt para obtener resultados de mayor calidad
        const enhancedPrompt = enhancePrompt(imagePrompt);
        console.log(`[IMAGINE] Prompt: "${imagePrompt}" -> Mejorado: "${enhancedPrompt}"`);

        // 5. Solicitar la imagen a la API (Timeout de 30s para evitar bloqueos infinitos)
        // Nota: Puedes cambiar esta URL por tu API de preferencia (ej. Shizo, Siputzx, etc.)
        const apiUrl = `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(enhancedPrompt)}`;
        
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const imageBuffer = Buffer.from(response.data);

        // 6. Enviar la imagen generada con diseño premium y botón CTA
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `╭━━━⊱ 🖼️ *IMAGEN GENERADA* ⊱━━━╮
│
│  📝 *Descripción:* _${imagePrompt}_
│  ✨ *Calidad:* Alta (Optimizada por IA)
│
│  🎨 ¡Espero que te guste el resultado!
│  ¿Quieres probar con otra idea?
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Creatividad IA`,
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

    } catch (error) {
        console.error('❌ Error en imagineCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE GENERACIÓN* ⊱━━━╮
│
│  No se pudo generar la imagen en este
│  momento. Es posible que la IA esté
│  saturada o el prompt sea muy complejo.
│
│  💡 *Consejo:* Intenta con una 
│  descripción más detallada o en inglés.
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

/**
 * Mejora el prompt añadiendo palabras clave de calidad para la IA.
 */
function enhancePrompt(prompt) {
    const qualityEnhancers = [
        'masterpiece', 'best quality', 'ultra realistic', '8k resolution',
        'cinematic lighting', 'highly detailed', 'sharp focus', 'vibrant colors',
        'trending on artstation', 'professional photography'
    ];
    
    // Seleccionar 3-4 mejoradores aleatorios para variar los resultados
    const numEnhancers = Math.floor(Math.random() * 2) + 3;
    const selectedEnhancers = qualityEnhancers
        .sort(() => Math.random() - 0.5)
        .slice(0, numEnhancers);

    // Las keywords en inglés ayudan a la mayoría de las IAs a entender mejor el estilo
    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}

module.exports = imagineCommand;