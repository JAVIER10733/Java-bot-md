const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const isAdmin = require('../lib/isAdmin');

/**
 * Helper para enviar mensajes de error con diseño premium y botón del canal.
 */
async function sendError(sock, chatId, text, message) {
    const botName = global.botname || 'Java Bot MD';
    const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
    
    await sock.sendMessage(chatId, {
        text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮\n│\n│  ${text}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
        footer: `🤖 ${botName} | Administración`,
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

/**
 * Helper para enviar mensajes de éxito con diseño premium y botón del canal.
 */
async function sendSuccess(sock, chatId, text, message) {
    const botName = global.botname || 'Java Bot MD';
    const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
    
    await sock.sendMessage(chatId, {
        text: `╭━━━⊱ ✅ *ÉXITO* ⊱━━━╮\n│\n│  ${text}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
        footer: `🤖 ${botName} | Administración`,
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

/**
 * Verifica que sea un grupo y que el usuario/bot tengan permisos de administrador.
 */
async function ensureGroupAndAdmin(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us')) {
        await sendError(sock, chatId, 'Este comando solo se puede usar en *grupos*.', message);
        return false;
    }
    
    const adminStatus = await isAdmin(sock, chatId, senderId, message);
    if (!adminStatus.isBotAdmin) {
        await sendError(sock, chatId, 'Necesito ser *administrador del grupo* para realizar esta acción.', message);
        return false;
    }
    if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
        await sendError(sock, chatId, 'Solo los *administradores del grupo* pueden usar este comando.', message);
        return false;
    }
    return true;
}

/**
 * Comando para cambiar la descripción del grupo (.setgdesc)
 */
async function setGroupDescription(sock, chatId, senderId, text, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check) return;
    
    const desc = (text || '').trim();
    if (!desc) {
        return await sock.sendMessage(chatId, { 
            text: '⚠️ Por favor, proporciona una descripción.\n\n💡 *Ejemplo:* `.setgdesc Bienvenidos al grupo oficial de Java Bot`' 
        }, { quoted: message });
    }
    
    try {
        await sock.groupUpdateDescription(chatId, desc);
        await sendSuccess(sock, chatId, 'La descripción del grupo ha sido *actualizada* exitosamente.', message);
    } catch (e) {
        console.error('❌ Error en setGroupDescription:', e);
        await sendError(sock, chatId, 'No se pudo actualizar la descripción. Es posible que sea demasiado larga.', message);
    }
}

/**
 * Comando para cambiar el nombre del grupo (.setgname)
 */
async function setGroupName(sock, chatId, senderId, text, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check) return;
    
    const name = (text || '').trim();
    if (!name) {
        return await sock.sendMessage(chatId, { 
            text: '⚠️ Por favor, proporciona un nuevo nombre.\n\n💡 *Ejemplo:* `.setgname Grupo de Amigos`' 
        }, { quoted: message });
    }
    
    try {
        await sock.groupUpdateSubject(chatId, name);
        await sendSuccess(sock, chatId, `El nombre del grupo ha sido cambiado a: *${name}*`, message);
    } catch (e) {
        console.error('❌ Error en setGroupName:', e);
        await sendError(sock, chatId, 'No se pudo actualizar el nombre. Verifica que no exceda el límite de caracteres.', message);
    }
}

/**
 * Comando para cambiar la foto de perfil del grupo (.setgpp)
 */
async function setGroupPhoto(sock, chatId, senderId, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check) return;

    // Soporte para mensajes normales y efímeros
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                   message.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                   
    const imageMessage = quoted?.imageMessage || quoted?.stickerMessage;
    
    if (!imageMessage) {
        return await sendError(sock, chatId, 'Debes *responder a una imagen o sticker* con el comando `.setgpp`.', message);
    }

    try {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        // Descargar el contenido de forma segura (acumulando chunks)
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const imgPath = path.join(tmpDir, `gpp_${Date.now()}.jpg`);
        fs.writeFileSync(imgPath, buffer);

        // Actualizar la foto de perfil
        await sock.updateProfilePicture(chatId, { url: imgPath });
        
        // Limpieza segura del archivo temporal
        try { 
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); 
        } catch (_) {}
        
        await sendSuccess(sock, chatId, 'La foto de perfil del grupo ha sido *actualizada* exitosamente.', message);
    } catch (e) {
        console.error('❌ Error en setGroupPhoto:', e);
        await sendError(sock, chatId, 'No se pudo actualizar la foto. Asegúrate de que la imagen no sea demasiado pesada o esté corrupta.', message);
    }
}

module.exports = {
    setGroupDescription,
    setGroupName,
    setGroupPhoto
};