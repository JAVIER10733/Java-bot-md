const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Java Bot MD - Comando de Descarga de Facebook (.fb)
 * Descarga videos de Facebook en la máxima calidad disponible (HD/SD).
 */
async function facebookCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Extraer y validar el enlace
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const url = text.split(' ').slice(1).join(' ').trim();
        
        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ 📘 *DESCARGA DE FACEBOOK* ⊱━━━╮\n│\n│  💡 *Uso:* .fb <enlace_de_facebook>\n│  💡 *Ejemplo:* .fb https://www.facebook.com/...\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Descargas rápidas`,
                buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: channelLink, merchant_url: channelLink }) }],
                headerType: 1
            }, { quoted: message });
        }

        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Ese no parece ser un enlace de Facebook válido. Por favor, verifica el enlace e inténtalo de nuevo.' 
            }, { quoted: message });
        }

        // 2. Reacción de carga
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // 3. Resolver redirecciones (para enlaces acortados fb.watch)
        let resolvedUrl = url;
        try {
            const res = await axios.get(url, { timeout: 15000, maxRedirects: 10, headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (res?.request?.res?.responseUrl) {
                resolvedUrl = res.request.res.responseUrl;
            }
        } catch { /* Ignorar errores de resolución, usar URL original */ }

        // 4. Consultar la API
        const apiUrl = `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(resolvedUrl)}`;
        const response = await axios.get(apiUrl, {
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            validateStatus: s => s >= 200 && s < 500
        });

        const data = response.data;
        let fbvid = null;
        let title = "Video de Facebook";

        // 5. Parsear respuesta (Priorizar HD, luego SD)
        if (data?.status && Array.isArray(data.data?.data)) {
            const hdVideo = data.data.data.find(item => item.resolution === 'HD' && item.format === 'mp4');
            const sdVideo = data.data.data.find(item => item.resolution === 'SD' && item.format === 'mp4');
            fbvid = hdVideo?.url || sdVideo?.url;
            title = data.data.title || title;
        }

        if (!fbvid) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ❌ *DESCARGA FALLIDA* ⊱━━━╮\n│\n│  No se pudo obtener el video.\n│\n│  📌 *Posibles razones:*\n│  • El video es privado o fue eliminado.\n│  • El enlace es inválido o está roto.\n│  • El video no está disponible para descarga.\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Soporte técnico`,
                buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Reportar en el Canal', url: channelLink, merchant_url: channelLink }) }],
                headerType: 1
            }, { quoted: message });
        }

        // 6. Método 1: Envío directo por URL (Más rápido y eficiente)
        try {
            await sock.sendMessage(chatId, {
                video: { url: fbvid },
                mimetype: "video/mp4",
                caption: `📘 *${title}*\n\n🤖 Descargado por *${botName}*`
            }, { quoted: message });
            
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            
            // 7. Mensaje de seguimiento con el BOTÓN DEL CANAL
            await sock.sendMessage(chatId, {
                text: `✨ ¡Video descargado exitosamente!\n\n📥 *Título:* _${title}_`,
                footer: `🤖 ${botName} | Descargas rápidas`,
                buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: channelLink, merchant_url: channelLink }) }],
                headerType: 1
            });
            return;

        } catch (urlError) {
            console.warn('⚠️ Método URL falló, intentando descarga por buffer:', urlError.message);
            
            // 8. Método 2: Fallback a descarga por buffer (Más robusto contra bloqueos de CDN)
            try {
                const tmpDir = path.join(process.cwd(), 'tmp');
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

                const tempFile = path.join(tmpDir, `fb_${Date.now()}.mp4`);

                const videoResponse = await axios({
                    method: 'GET',
                    url: fbvid,
                    responseType: 'stream',
                    timeout: 60000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                        'Referer': 'https://www.facebook.com/'
                    }
                });

                const writer = fs.createWriteStream(tempFile);
                videoResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
                    throw new Error('El archivo descargado está vacío o corrupto.');
                }

                await sock.sendMessage(chatId, {
                    video: { url: tempFile },
                    mimetype: "video/mp4",
                    caption: `📘 *${title}*\n\n🤖 Descargado por *${botName}*`
                }, { quoted: message });
                
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

                // Mensaje de seguimiento con el BOTÓN DEL CANAL
                await sock.sendMessage(chatId, {
                    text: `✨ ¡Video descargado exitosamente!\n\n📥 *Título:* _${title}_`,
                    footer: `🤖 ${botName} | Descargas rápidas`,
                    buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: channelLink, merchant_url: channelLink }) }],
                    headerType: 1
                });

                // Limpieza segura
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                return;

            } catch (bufferError) {
                console.error('❌ Método de buffer también falló:', bufferError.message);
                throw new Error('No se pudo descargar el video por ningún método.');
            }
        }

    } catch (error) {
        console.error('❌ Error en facebookCommand:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { 
            text: `❌ *Error inesperado*\n\nOcurrió un problema al procesar tu solicitud. Es posible que la API esté temporalmente saturada.\n\nPor favor, inténtalo de nuevo en unos minutos.`,
            footer: `🤖 ${botName} | Soporte técnico`,
            buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Reportar en el Canal', url: channelLink, merchant_url: channelLink }) }],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = facebookCommand;