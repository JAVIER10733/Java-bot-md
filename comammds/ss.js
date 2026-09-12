const fetch = require('node-fetch');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando de Captura de Pantalla Web (.ss / .ssweb / .screenshot)
 * Toma una captura de pantalla de alta calidad de cualquier sitio web.
 */
async function handleSsCommand(sock, chatId, message, match) {
    try {
        // 1. Validar que se haya proporcionado una URL
        if (!match || match.trim() === '') {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 📸 *CAPTURA DE PANTALLA* ⊱━━━╮
│
│  Toma una captura de pantalla de 
│  alta calidad de cualquier sitio web.
│
│  💡 *Uso:* .ss <url_del_sitio>
│  💡 *Ejemplo:* .ss google.com
│  💡 *Ejemplo:* .ss https://github.com
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

        // 2. Procesar y validar la URL
        let targetUrl = match.trim();
        
        // Corrección automática: si no tiene http/https, lo añadimos
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }

        // Validación estricta de URL
        try {
            new URL(targetUrl);
        } catch {
            return await sock.sendMessage(chatId, {
                text: '❌ *URL inválida.*\n\nPor favor, proporciona una dirección web válida (ej: google.com o https://ejemplo.com).',
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

        // 3. Indicador de escritura y reacción de procesamiento
        await sock.sendPresenceUpdate('composing', chatId);
        await sock.sendMessage(chatId, { react: { text: '📸', key: message.key } });

        // 4. Llamar a la API con Timeout (15 segundos máximo para evitar bloqueos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response;
        try {
            const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(targetUrl)}&theme=light&device=desktop`;
            response = await fetch(apiUrl, { 
                signal: controller.signal,
                headers: { 'accept': '*/*' } 
            });
            clearTimeout(timeoutId);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw new Error('Tiempo de espera agotado o API no disponible');
        }

        if (!response.ok) {
            throw new Error(`La API respondió con estado: ${response.status}`);
        }

        // 5. Obtener el buffer de la imagen
        const imageBuffer = await response.buffer();

        // 6. Extraer el dominio para un caption elegante
        const domain = new URL(targetUrl).hostname;
        const caption = `╭━━━⊱ ✅ *CAPTURA EXITOSA* ⊱━━━╮
│
│  🌐 *Sitio:* _${domain}_
│  💻 *Dispositivo:* Escritorio
│  🎨 *Tema:* Claro (Light)
│
│  📸 La captura se ha generado 
│  y enviado correctamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // 7. Enviar la imagen con diseño premium y botón CTA
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: caption,
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

        // 8. Reacción de éxito y detener escritura
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        await sock.sendPresenceUpdate('paused', chatId);

    } catch (error) {
        console.error('❌ Error en handleSsCommand:', error.message);
        await sock.sendPresenceUpdate('paused', chatId);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE CAPTURA* ⊱━━━╮
│
│  No se pudo tomar la captura de 
│  pantalla en este momento.
│
│  💡 *Posibles causas:*
│  • El sitio web bloquea capturas.
│  • La URL es incorrecta o el sitio 
│    está caído.
│  • El servicio de captura está 
│    temporalmente saturado.
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

module.exports = { handleSsCommand };