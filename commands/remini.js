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
        // 1. Imagen citada (soporta mensajes normales y efímeros)
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

        // 3. Fallback a la foto de perfil del usuario mencionado o remitente
        let targetJid = message.key.participant || message.key.remoteJid;
        const ctx = message.message?.extendedTextMessage?.contextInfo || 
                    message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;
                    
        if (ctx?.mentionedJid?.length > 0) {
            targetJid = ctx.mentionedJid[0];
        } else if (ctx?.participant) {
            targetJid = ctx.participant;
        }

        try {
            return await sock.profilePictureUrl(targetJid, 'image');
        } catch {
            return null;
        }
    } catch (error) {
        console.error('⚠️ Error obteniendo URL de imagen:', error.message);
        return null;
    }
}

/**
 * Java Bot MD - Comando de Mejora de Imágenes con IA (.remini)
 * Restaura y mejora la calidad de fotos borrosas o de baja resolución.
 */
async function reminiCommand(sock, chatId, message, args) {
    try {
        // 1. Extraer y validar la imagen
        let imageUrl = null;
        
        if (args.length > 0) {
            const url = args.join(' ');
            if (isValidUrl(url)) {
                imageUrl = url;
            } else {
                return await sock.sendMessage(chatId, { 
                    text: '❌ *URL inválida.*\n\nPor favor, proporciona un enlace directo a una imagen válida (JPG, PNG).' 
                }, { quoted: message });
            }
        } else {
            imageUrl = await getQuotedOrOwnImageUrl(sock, message);
            
            if (!imageUrl) {
                return await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ 🪄 *MEJORA DE IMAGEN (REMINI)* ⊱━━━╮
│
│  Mejora la calidad de tus fotos
│  borrosas o de baja resolución
│  usando Inteligencia Artificial.
│
│  💡 *Uso:* 
│  • .remini <enlace_de_imagen>
│  • Responde a una imagen con .remini
│  • Envía una imagen con .remini
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${BOT_NAME} | Edición con IA`,
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
        }

        // 2. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // 3. Llamar a la API de Remini con timeout extendido (la IA tarda más)
        const apiUrl = `https://api.princetechn.com/api/tools/remini?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(imageUrl)}`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000, // 60 segundos de límite
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        if (response.data && response.data.success && response.data.result && response.data.result.image_url) {
            const resultUrl = response.data.result.image_url;
            
            // 4. Descargar la imagen mejorada
            const imageResponse = await axios.get(resultUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            
            if (imageResponse.status === 200 && imageResponse.data) {
                // 5. Enviar la imagen mejorada con diseño premium
                await sock.sendMessage(chatId, {
                    image: imageResponse.data,
                    caption: `╭━━━⊱ ✨ *IMAGEN MEJORADA* ⊱━━━╮
│
│  🪄 *Proceso:* Remini AI Upscale
│  📐 *Calidad:* Alta Definición (HD)
│
│  ✅ ¡Tu imagen ha sido restaurada 
│  y mejorada exitosamente!
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${BOT_NAME} | Edición con IA`,
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
                
                // 6. Reacción de éxito
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            } else {
                throw new Error('No se pudo descargar la imagen mejorada del servidor.');
            }
        } else {
            throw new Error(response.data?.message || 'La API no devolvió una imagen válida.');
        }

    } catch (error) {
        console.error('❌ Error en reminiCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        let errorMessage = 'Ocurrió un problema inesperado al procesar la imagen.';
        
        if (error.response?.status === 429) {
            errorMessage = '⏰ *Límite de peticiones alcanzado.*\nEl servidor está saturado. Inténtalo de nuevo en unos minutos.';
        } else if (error.response?.status === 400) {
            errorMessage = '❌ *URL o formato de imagen inválido.*\nAsegúrate de que el enlace sea directo a una imagen (JPG, PNG).';
        } else if (error.response?.status === 500) {
            errorMessage = '🔧 *Error del servidor.*\nEl servicio de IA está temporalmente fuera de servicio.';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '⏰ *Tiempo de espera agotado.*\nEl procesamiento está tardando demasiado. Intenta con una imagen más pequeña.';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            errorMessage = '🌐 *Error de red.*\nNo se pudo conectar con el servidor de procesamiento.';
        }
        
        await sock.sendMessage(chatId, { 
            text: `╭━━━⊱ ❌ *ERROR DE PROCESAMIENTO* ⊱━━━╮
│
│  ${errorMessage}
│
│  💡 *Consejo:* Intenta con otra imagen 
│  o verifica que el enlace sea válido.
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
 * Helper para validar si una cadena es una URL válida.
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

module.exports = { reminiCommand };