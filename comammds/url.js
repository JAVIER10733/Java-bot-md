const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { UploadFileUgu, TelegraPh } = require('../lib/uploader');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Extrae el buffer y la extensión de un mensaje multimedia.
 */
async function getMediaBufferAndExt(msgObj) {
    const m = msgObj.message || msgObj;
    
    if (m.imageMessage) {
        const stream = await downloadContentFromMessage(m.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.jpg', type: 'Imagen' };
    }
    if (m.videoMessage) {
        const stream = await downloadContentFromMessage(m.videoMessage, 'video');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.mp4', type: 'Video' };
    }
    if (m.audioMessage) {
        const stream = await downloadContentFromMessage(m.audioMessage, 'audio');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.mp3', type: 'Audio' };
    }
    if (m.documentMessage) {
        const stream = await downloadContentFromMessage(m.documentMessage, 'document');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const fileName = m.documentMessage.fileName || 'archivo.bin';
        const ext = path.extname(fileName) || '.bin';
        return { buffer: Buffer.concat(chunks), ext, type: 'Documento' };
    }
    if (m.stickerMessage) {
        const stream = await downloadContentFromMessage(m.stickerMessage, 'sticker');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.webp', type: 'Sticker' };
    }
    return null;
}

/**
 * Extrae el medio de un mensaje citado (soporta mensajes normales y efímeros).
 */
async function getQuotedMediaBufferAndExt(message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                   message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return null;
    return getMediaBufferAndExt({ message: quoted });
}

/**
 * Java Bot MD - Comando para obtener enlace de multimedia (.url)
 * Sube imágenes, videos, audios o documentos a la nube y devuelve un enlace directo.
 */
async function urlCommand(sock, chatId, message) {
    let tempPath = '';
    
    try {
        // 1. Intentar obtener medio del mensaje actual o del citado
        let media = await getMediaBufferAndExt(message);
        if (!media) media = await getQuotedMediaBufferAndExt(message);

        // 2. Si no hay medio, mostrar ayuda con diseño premium
        if (!media) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🔗 *OBTENER ENLACE (URL)* ⊱━━━╮
│
│  Sube tus archivos multimedia a la 
│  nube y obtén un enlace directo 
│  para compartir fácilmente.
│
│  💡 *Uso:* 
│  • Envía un archivo y escribe *.url*
│  • Responde a un archivo con *.url*
│
│  📁 *Soporta:* Imágenes, videos, 
│  audios, stickers y documentos.
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

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // 4. Guardar archivo temporalmente
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        
        tempPath = path.join(tempDir, `${Date.now()}_${Math.random().toString(36).substring(7)}${media.ext}`);
        fs.writeFileSync(tempPath, media.buffer);

        let url = '';

        // 5. Subir el archivo (TelegraPh para imágenes/webp, Uguu para el resto)
        try {
            if (media.ext === '.jpg' || media.ext === '.png' || media.ext === '.webp') {
                try {
                    url = await TelegraPh(tempPath);
                } catch {
                    // Fallback a Uguu si TelegraPh falla
                    const res = await UploadFileUgu(tempPath);
                    url = typeof res === 'string' ? res : (res.url || res.url_full || JSON.stringify(res));
                }
            } else {
                const res = await UploadFileUgu(tempPath);
                url = typeof res === 'string' ? res : (res.url || res.url_full || JSON.stringify(res));
            }
        } finally {
            // 6. Limpieza segura del archivo temporal (con retraso para evitar bloqueos)
            setTimeout(() => {
                try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
            }, 3000);
        }

        // 7. Validar que se obtuvo un enlace
        if (!url || url.includes('undefined') || url.includes('null')) {
            throw new Error('El servidor de subida no devolvió un enlace válido.');
        }

        // 8. Enviar el enlace con diseño de tarjeta premium y botón CTA
        const successMessage = `╭━━━⊱ ✅ *ENLACE GENERADO* ⊱━━━╮
│
│  📁 *Tipo de archivo:* ${media.type}
│  🔗 *Enlace directo:* 
│  ${url}
│
│  💡 *Nota:* Copia el enlace antes de 
│  que expire (depende del servidor).
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: successMessage,
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

        // 9. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en urlCommand:', error.message);
        
        // Limpieza de emergencia en caso de fallo
        if (tempPath) {
            try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
        }

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE SUBIDA* ⊱━━━╮
│
│  No se pudo subir el archivo a la nube.
│
│  💡 *Posibles causas:*
│  • El archivo es demasiado grande.
│  • Los servidores de subida (TelegraPh/Uguu) 
│    están temporalmente saturados.
│  • El formato del archivo no es soportado.
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

module.exports = urlCommand;