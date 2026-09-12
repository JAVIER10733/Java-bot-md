const { ttdl } = require("ruhend-scraper");
const axios = require('axios');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

// Almacén para prevenir el procesamiento duplicado del mismo mensaje
const processedMessages = new Set();

/**
 * Java Bot MD - Comando de Descarga de TikTok (.tiktok / .tt)
 * Descarga videos de TikTok sin marca de agua con un sistema de respaldo infalible.
 */
async function tiktokCommand(sock, chatId, message) {
    try {
        // 1. Prevención de duplicados
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000); // Limpiar a los 5 min

        // 2. Extraer texto y buscar URL
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const urlMatch = text.match(/https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+/);

        if (!urlMatch) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🎵 *DESCARGA DE TIKTOK* ⊱━━━╮
│
│  Descarga videos de TikTok sin 
│  marca de agua de forma rápida 
│  y en alta calidad.
│
│  💡 *Uso:* .tiktok <enlace>
│  💡 *Ejemplo:* .tiktok https://vm.tiktok.com/...
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Descargas rápidas`,
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

        const url = urlMatch[0];

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        let videoUrl = null;
        let title = "Video de TikTok";

        // 4. SISTEMA DE DESCARGA EN CASCADA (Máxima fiabilidad)
        
        // Intento 1: API Siputzx
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`, {
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            
            if (res.data?.status && res.data?.data) {
                const d = res.data.data;
                videoUrl = d.urls?.[0] || d.video_url || d.url || d.download_url;
                title = d.metadata?.title || title;
            }
        } catch (err) {
            console.warn('⚠️ Siputzx API falló, intentando fallback...');
        }

        // Intento 2: Scraper ttdl (si Siputzx falló)
        if (!videoUrl) {
            try {
                const ttdlData = await ttdl(url);
                if (ttdlData?.data?.length > 0) {
                    // Buscar el primer elemento que sea video o termine en .mp4
                    const media = ttdlData.data.find(m => m.type === 'video' || /\.mp4$/i.test(m.url)) || ttdlData.data[0];
                    videoUrl = media.url;
                    title = ttdlData.data[0]?.title || title;
                }
            } catch (err) {
                console.error('❌ Fallback ttdl también falló:', err.message);
            }
        }

        // 5. Validar que se obtuvo una URL
        if (!videoUrl) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *DESCARGA FALLIDA* ⊱━━━╮
│
│  No se pudo obtener el video.
│
│  📌 *Posibles razones:*
│  • El video es privado o fue eliminado.
│  • El enlace es inválido o está roto.
│  • Los servidores de descarga están 
│    temporalmente saturados.
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

        // 6. Enviar el video (Método Buffer primero, luego URL directa como fallback)
        const cleanCaption = `╭━━━⊱ ✅ *TIKTOK DESCARGADO* ⊱━━━╮
│
│  📝 *Título:* _${title.length > 60 ? title.substring(0, 60) + '...' : title}_
│  🤖 *Descargado por:* ${BOT_NAME}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        try {
            // Método A: Descarga por Buffer (Más confiable contra bloqueos de CDN)
            const videoResponse = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                maxContentLength: 100 * 1024 * 1024, // 100MB límite
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'video/mp4,video/*,*/*;q=0.9',
                    'Referer': 'https://www.tiktok.com/'
                }
            });
            
            const videoBuffer = Buffer.from(videoResponse.data);
            
            if (videoBuffer.length > 1000) { // Validación básica de que no está vacío
                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: "video/mp4",
                    caption: cleanCaption
                }, { quoted: message });
            } else {
                throw new Error("El buffer del video está vacío o corrupto");
            }
        } catch (bufferError) {
            console.warn('⚠️ Método buffer falló, usando método URL directa...');
            // Método B: Fallback a URL directa
            await sock.sendMessage(chatId, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: cleanCaption
            }, { quoted: message });
        }

        // 7. Reacción de éxito y mensaje de seguimiento con botón
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `✨ ¡Descarga completada exitosamente!\n\n🎵 *Título:* _${title}_`,
            footer: `🤖 ${BOT_NAME} | Descargas rápidas`,
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

    } catch (error) {
        console.error('❌ Error en tiktokCommand:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `❌ *Error inesperado*\n\nOcurrió un problema al procesar tu solicitud. Por favor, verifica el enlace e inténtalo de nuevo.`,
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

module.exports = tiktokCommand;