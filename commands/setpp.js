const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando para Cambiar la Foto de Perfil del Bot (.setpp)
 * Permite al dueño del bot actualizar su foto de perfil de forma rápida y segura.
 */
async function setProfilePicture(sock, chatId, msg) {
    try {
        // 1. Validación de seguridad: Solo el dueño del bot
        if (!msg.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando global. Solo el *dueño del bot* puede configurarlo.' 
            }, { quoted: msg });
        }

        // 2. Extraer el mensaje citado (soporta mensajes normales y efímeros)
        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                              msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMessage) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🖼️ *CAMBIAR FOTO DE PERFIL* ⊱━━━╮
│
│  Actualiza la foto de perfil del bot
│  de forma rápida y sencilla.
│
│  💡 *Uso:* Responde a una imagen o 
│  sticker con el comando *.setpp*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Configuración global`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: CHANNEL_LINK,
                        merchant_url: CHANNEL_LINK
                    })
                }],
                headerType: 1
            }, { quoted: msg });
        }

        const imageMessage = quotedMessage.imageMessage || quotedMessage.stickerMessage;
        if (!imageMessage) {
            return await sock.sendMessage(chatId, { 
                text: '❌ El mensaje al que respondiste debe contener una *imagen* o un *sticker*.' 
            }, { quoted: msg });
        }

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

        // 4. Crear directorio temporal de forma segura
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // 5. Descargar la imagen/sticker
        const mediaType = imageMessage.mimetype?.includes('webp') ? 'sticker' : 'image';
        const stream = await downloadContentFromMessage(imageMessage, mediaType);
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const imagePath = path.join(tmpDir, `profile_${Date.now()}.jpg`);
        fs.writeFileSync(imagePath, buffer);

        // 6. Actualizar la foto de perfil del bot
        await sock.updateProfilePicture(sock.user.id, { url: imagePath });

        // 7. Limpieza segura del archivo temporal
        try {
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        } catch (err) {
            console.warn('⚠️ No se pudo eliminar el archivo temporal:', err.message);
        }

        // 8. Mensaje de éxito con diseño premium y botón CTA
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ✅ *FOTO ACTUALIZADA* ⊱━━━╮
│
│  🖼️ La foto de perfil del bot ha 
│  sido actualizada exitosamente.
│
│  🤖 Los cambios se reflejarán en 
│  unos segundos para todos los usuarios.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Configuración global`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: CHANNEL_LINK,
                    merchant_url: CHANNEL_LINK
                })
            }],
            headerType: 1
        }, { quoted: msg });

        // 9. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

    } catch (error) {
        console.error('❌ Error en setProfilePicture:', error);
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE ACTUALIZACIÓN* ⊱━━━╮
│
│  No se pudo actualizar la foto de 
│  perfil del bot.
│
│  💡 *Posibles causas:*
│  • La imagen es demasiado grande o 
│    tiene un formato no soportado.
│  • WhatsApp está limitando temporalmente 
│    los cambios de perfil.
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
        }, { quoted: msg });
    }
}

module.exports = setProfilePicture;