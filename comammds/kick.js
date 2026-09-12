/**
 * Java Bot MD - Comando Kick (.kick)
 * Expulsa a un usuario del grupo de forma segura y validada.
 */
const isAdmin = require('../lib/isAdmin');

async function kickCommand(sock, chatId, senderId, mentionedJidList, message) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: '❌ Este comando solo se puede usar en grupos.'
            }, { quoted: message });
        }

        // 2. Validar permisos de administrador
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
        
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Necesito ser *administrador* para poder expulsar usuarios.'
            }, { quoted: message });
        }

        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Solo los *administradores* pueden usar este comando.'
            }, { quoted: message });
        }

        // 3. Determinar el objetivo a expulsar (Múltiples métodos de detección)
        let targetJid = null;

        // Método A: Por mención (@usuario)
        if (mentionedJidList && mentionedJidList.length > 0) {
            targetJid = mentionedJidList[0];
        } 
        // Método B: Por respuesta a un mensaje (Reply)
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = message.message.extendedTextMessage.contextInfo.participant;
        }
        // Método C: Por número escrito en el texto (ej: .kick 593999999999)
        else {
            const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
            const args = rawText.split(' ').slice(1);
            if (args.length > 0) {
                const number = args[0].replace(/\D/g, ''); // Solo dígitos
                if (number.length >= 10) {
                    targetJid = `${number}@s.whatsapp.net`;
                }
            }
        }

        // 4. Validar que se haya encontrado un objetivo
        if (!targetJid) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *USO INCORRECTO* ⊱━━━╮
│
│  Debes mencionar, responder o escribir 
│  el número del usuario a expulsar.
│
│  💡 *Ejemplos:*
│  • .kick @usuario (Mencionando)
│  • .kick (Respondiendo a su mensaje)
│  • .kick 593999999999 (Número directo)
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });
        }

        // 5. Validaciones de seguridad
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        if (targetJid === botJid) {
            return await sock.sendMessage(chatId, {
                text: '❌ No puedo expulsarme a mí mismo. 🤖'
            }, { quoted: message });
        }

        if (targetJid === senderId) {
            return await sock.sendMessage(chatId, {
                text: '❌ No puedes expulsarte a ti mismo. Usa .leave si quieres salir.'
            }, { quoted: message });
        }

        // 6. Verificar si el objetivo existe en el grupo y si es admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const targetParticipant = groupMetadata.participants.find(p => p.id === targetJid);
        
        if (!targetParticipant) {
            return await sock.sendMessage(chatId, {
                text: '❌ El usuario no se encuentra en este grupo.'
            }, { quoted: message });
        }

        if (targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin') {
            return await sock.sendMessage(chatId, {
                text: `⚠️ No puedo expulsar a *@${targetJid.split('@')[0]}* porque es un administrador.\n\n💡 Primero degrádalo con el comando *.demote*`
            }, { quoted: message });
        }

        // 7. Ejecutar la expulsión
        await sock.sendMessage(chatId, { react: { text: '👢', key: message.key } });
        
        await sock.groupParticipantsUpdate(chatId, [targetJid], 'remove');
        
        const targetName = targetParticipant.notify || targetJid.split('@')[0];
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ✅ *USUARIO EXPULSADO* ⊱━━━╮
│
│  👢 *@${targetJid.split('@')[0]}* ha sido 
│  expulsado del grupo exitosamente.
│
│  🛡️ Acción realizada por: @${senderId.split('@')[0]}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            mentions: [targetJid, senderId]
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en kickCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        let errorMsg = '❌ Ocurrió un error al intentar expulsar al usuario.';
        if (error.message.includes('not-authorized')) {
            errorMsg = '⚠️ *Error de permisos:* No tengo autoridad para expulsar a este usuario o ya no soy administrador.';
        } else if (error.message.includes('participant')) {
            errorMsg = '❌ El usuario no está en el grupo o el ID es incorrecto.';
        }
        
        await sock.sendMessage(chatId, {
            text: errorMsg,
            footer: 'Java Bot MD · Moderación'
        }, { quoted: message });
    }
}

module.exports = kickCommand;