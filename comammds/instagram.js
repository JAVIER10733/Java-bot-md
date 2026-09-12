const { igdl } = require("ruhend-scraper");

// Almacén para prevenir el procesamiento duplicado del mismo mensaje
const processedMessages = new Set();

/**
 * Extrae URLs de medios únicas, eliminando duplicados exactos.
 */
function extractUniqueMedia(mediaData) {
    const uniqueMedia = [];
    const seenUrls = new Set();
    
    for (const media of mediaData) {
        if (!media || !media.url) continue;
        if (!seenUrls.has(media.url)) {
            seenUrls.add(media.url);
            uniqueMedia.push(media);
        }
    }
    return uniqueMedia;
}

/**
 * Java Bot MD - Comando de Descarga de Instagram (.instagram / .ig)
 * Descarga fotos, videos, reels y carruseles de Instagram de forma rápida y segura.
 */
async function instagramCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Prevención de duplicados
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000); // Limpiar a los 5 min

        // 2. Extraer texto y validar
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        
        const instagramPatterns = [
            /https?:\/\/(?:www\.)?instagram\.com\//,
            /https?:\/\/(?:www\.)?instagr\.am\//
        ];

        const isValidUrl = instagramPatterns.some(pattern => pattern.test(text));
        
        if (!text || !isValidUrl) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 📥 *DESCARGA DE INSTAGRAM* ⊱━━━╮
│
│  Descarga fotos, videos, reels y 
│  carruseles de Instagram fácilmente.
│
│  💡 *Uso:* .ig <enlace_de_instagram>
│  💡 *Ejemplo:* .ig https://www.instagram.com/reel/...
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Descargas rápidas`,
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
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // 4. Consultar al scraper
        const downloadData = await igdl(text).catch(() => null);
        
        if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *DESCARGA FALLIDA* ⊱━━━╮
│
│  No se encontró contenido en este enlace.
│
│  📌 *Posibles razones:*
│  • La cuenta o publicación es privada.
│  • El enlace está roto o es inválido.
│  • El scraper de Instagram está saturado.
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

        // 5. Procesar y limitar los medios (máximo 15 para evitar rate limits)
        const uniqueMedia = extractUniqueMedia(downloadData.data);
        const mediaToDownload = uniqueMedia.slice(0, 15);
        
        let successCount = 0;

        // 6. Bucle de descarga
        for (let i = 0; i < mediaToDownload.length; i++) {
            try {
                const media = mediaToDownload[i];
                const mediaUrl = media.url;

                // Detección inteligente de tipo de medio
                const isVideo = media.type === 'video' || 
                                /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                                text.includes('/reel/') || 
                                text.includes('/tv/');

                if (isVideo) {
                    await sock.sendMessage(chatId, {
                        video: { url: mediaUrl },
                        mimetype: "video/mp4",
                        caption: `📥 *Reel/Video descargado*\n🤖 Por ${botName}`
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, {
                        image: { url: mediaUrl },
                        caption: `📥 *Foto descargada*\n🤖 Por ${botName}`
                    }, { quoted: message });
                }
                
                successCount++;

                // Retraso de 1.5 segundos entre descargas para evitar bloqueos de Instagram
                if (i < mediaToDownload.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                
            } catch (mediaError) {
                console.error(`⚠️ Error descargando medio ${i + 1}:`, mediaError.message);
                // Continuar con el siguiente si uno falla
            }
        }

        // 7. Reacción final y mensaje de resumen con el BOTÓN DEL CANAL
        if (successCount > 0) {
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            
            await sock.sendMessage(chatId, {
                text: `✨ ¡Descarga completada!\n\n📥 *Archivos obtenidos:* ${successCount}/${mediaToDownload.length}\n🔗 *Origen:* Instagram`,
                footer: `🤖 ${botName} | Descargas rápidas`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }],
                headerType: 1
            });
        } else {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            await sock.sendMessage(chatId, { text: '❌ No se pudo descargar ningún archivo. Intenta con otro enlace.' }, { quoted: message });
        }

    } catch (error) {
        console.error('❌ Error en instagramCommand:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `❌ *Error inesperado*\n\nOcurrió un problema al procesar tu solicitud. Por favor, inténtalo de nuevo en unos minutos.`,
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

module.exports = instagramCommand;