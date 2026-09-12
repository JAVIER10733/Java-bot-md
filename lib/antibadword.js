const { setAntiBadword, getAntiBadword, removeAntiBadword, incrementWarningCount, resetWarningCount } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

// Lista optimizada de palabras y frases prohibidas
const BAD_WORDS = [
    // Insultos comunes en español
    'gandu', 'madarchod', 'bhosdike', 'bsdk', 'bhosda', 'lauda', 'laude', 
    'betichod', 'chutiya', 'maa ki chut', 'behenchod', 'behen ki chut', 
    'randi', 'chuchi', 'puta', 'puto', 'maricon', 'maricón', 'cabrón', 'cabron',
    'joder', 'mierda', 'coño', 'verga', 'pito', 'hijo de puta', 'gilipollas', 
    'imbécil', 'pendejo', 'pendeja', 'maldito', 'maldita',
    
    // Insultos comunes en inglés
    'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 
    'pussy', 'cunt', 'nigga', 'nigger', 'idiot', 'moron', 'retard', 'slut', 'whore',
    
    // Variaciones con símbolos o números (Leet speak básico)
    'f*ck', 'fuk', 'fcuk', 'b!tch', 'pvt', 'ctm', 'ctmr',
    
    // Frases compuestas
    'hijo de puta', 'hijueputa', 'concha tu madre', 'chupame la verga', 'chupa la verga'
];

/**
 * Comando principal para configurar el sistema (.antibadword)
 */
async function handleAntiBadwordCommand(sock, chatId, message, match) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;

        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        // 2. Validar permisos de administrador
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId, message);
        
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *PERMISOS INSUFICIENTES* ⊱━━━╮
│
│  Necesito ser *administrador* para 
│  gestionar el filtro de palabras.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        if (!isSenderAdmin && !message.key.fromMe) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ACCESO DENEGADO* ⊱━━━╮
│
│  Solo los *administradores* pueden 
│  configurar este sistema.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        // 3. Mostrar menú de ayuda si no hay argumentos
        if (!match || match.trim() === '') {
            const helpMessage = `╭━━━⊱ 🛡️ *FILTRO ANTIBADWORD* ⊱━━━╮
│
│  Mantén tu grupo limpio y libre de 
│  lenguaje inapropiado de forma 
│  automática y eficiente.
│
│  ⚙️ *Comandos disponibles:*
│  • *.antibadword on*      → Activar filtro
│  • *.antibadword off*     → Desactivar filtro
│  • *.antibadword set <acción>* → Cambiar sanción
│
│  📌 *Acciones disponibles:*
│  • *delete* → Solo borra el mensaje.
│  • *warn*   → Advierte (3 strikes = expulsión).
│  • *kick*   → Expulsa inmediatamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        const action = match.trim().toLowerCase();

        // 4. Activar el sistema
        if (action === 'on') {
            const existingConfig = await getAntiBadword(chatId, 'on');
            if (existingConfig?.enabled) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ El sistema *AntiBadword* ya está activado en este grupo.' 
                }, { quoted: message });
            }
            await setAntiBadword(chatId, 'on', 'delete');
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ✅ *SISTEMA ACTIVADO* ⊱━━━╮
│
│  🛡️ *Estado:* Activado
│  🔨 *Sanción por defecto:* Eliminar
│
│  💡 Usa *.antibadword set <acción>* 
│  para cambiar el tipo de sanción.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        // 5. Desactivar el sistema
        if (action === 'off') {
            const config = await getAntiBadword(chatId, 'on');
            if (!config?.enabled) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ El sistema *AntiBadword* ya está desactivado.' 
                }, { quoted: message });
            }
            await removeAntiBadword(chatId);
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ 🔓 *SISTEMA DESACTIVADO* ⊱━━━╮
│
│  El filtro de malas palabras ha sido 
│  desactivado exitosamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        // 6. Configurar la acción (set)
        if (action.startsWith('set')) {
            const sanction = action.split(' ')[1]?.toLowerCase();
            
            if (!sanction || !['delete', 'kick', 'warn'].includes(sanction)) {
                return await sock.sendMessage(chatId, { 
                    text: `╭━━━⊱ ❌ *ACCIÓN NO VÁLIDA* ⊱━━━╮
│
│  Por favor, elige una de estas opciones:
│  • *delete*
│  • *kick*
│  • *warn*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${BOT_NAME} | Moderación`,
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

            await setAntiBadword(chatId, 'on', sanction);
            
            const sanctionEmojis = { 'delete': '🗑️', 'kick': '👢', 'warn': '⚠️' };
            const sanctionNames = { 'delete': 'Eliminar mensaje', 'kick': 'Expulsar usuario', 'warn': 'Sistema de advertencias (3 strikes)' };

            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ⚙️ *CONFIGURACIÓN ACTUALIZADA* ⊱━━━╮
│
│  🛡️ *Estado:* Activado
│  🔨 *Sanción:* ${sanctionEmojis[sanction]} ${sanctionNames[sanction]}
│
│  ✅ Los cambios se aplican de inmediato.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Moderación`,
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

        // 7. Comando no reconocido
        return await sock.sendMessage(chatId, { 
            text: '❌ *Comando no reconocido.*\n\nEscribe *.antibadword* sin argumentos para ver el menú de ayuda.' 
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en handleAntiBadwordCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al procesar la configuración. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

/**
 * Detector automático de malas palabras en los mensajes del grupo
 */
async function handleBadwordDetection(sock, chatId, message, userMessage, senderId) {
    try {
        // Validaciones iniciales rápidas
        if (!chatId.endsWith('@g.us')) return;
        if (message.key.fromMe) return;
        if (!userMessage || typeof userMessage !== 'string') return;

        // Verificar si el sistema está activado
        const antiBadwordConfig = await getAntiBadword(chatId, 'on');
        if (!antiBadwordConfig?.enabled) return;

        // Normalizar el mensaje
        const cleanMessage = userMessage.toLowerCase().replace(/\s+/g, ' ').trim();

        // Verificar si contiene alguna palabra o frase prohibida
        let containsBadWord = false;
        let detectedWord = '';

        for (const word of BAD_WORDS) {
            if (word.includes(' ')) {
                // Para frases con espacios, usamos includes
                if (cleanMessage.includes(word)) {
                    containsBadWord = true;
                    detectedWord = word;
                    break;
                }
            } else {
                // Para palabras sueltas, usamos límites de palabra (\b) para evitar falsos positivos
                // (ej: que no detecte "ass" dentro de "class" o "pito" dentro de "capitán")
                const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
                if (regex.test(cleanMessage)) {
                    containsBadWord = true;
                    detectedWord = word;
                    break;
                }
            }
        }

        // Si no hay malas palabras, salir silenciosamente
        if (!containsBadWord) return;

        // --- ACCIÓN DE MODERACIÓN ---

        // 1. Verificar permisos del bot
        const groupMetadata = await sock.groupMetadata(chatId);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = groupMetadata.participants.find(p => p.id === botId);
        
        if (!botParticipant?.admin) {
            console.warn('⚠️ AntiBadword: El bot no es admin, no se puede tomar acción.');
            return;
        }

        // 2. Verificar si el infractor es admin o el creador del grupo (Protección)
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        if (senderParticipant?.admin || senderParticipant?.superadmin) {
            console.log('✅ AntiBadword: Administrador detectado, acción omitida.');
            return;
        }

        // 3. Eliminar el mensaje ofensivo inmediatamente
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch (err) {
            console.error('❌ Error al eliminar el mensaje:', err);
            return; // Si no puede borrar, no tiene sentido continuar
        }

        const userMention = `@${senderId.split('@')[0]}`;
        const sanction = antiBadwordConfig.action || 'delete';

        // 4. Aplicar la sanción configurada con diseño premium
        switch (sanction) {
            case 'delete':
                await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ 🚫 *MENSAJE ELIMINADO* ⊱━━━╮
│
│  👤 *Usuario:* ${userMention}
│  📝 *Motivo:* Lenguaje inapropiado.
│
│  ⚠️ Por favor, mantén el respeto 
│  en el grupo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    mentions: [senderId]
                });
                break;

            case 'kick':
                try {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await sock.sendMessage(chatId, {
                        text: `╭━━━⊱ 👢 *USUARIO EXPULSADO* ⊱━━━╮
│
│  👤 *Expulsado:* ${userMention}
│  🚫 *Motivo:* Uso de lenguaje 
│  inapropiado (Expulsión directa).
│
│  🛡️ La seguridad del grupo es 
│  nuestra prioridad.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                        mentions: [senderId]
                    });
                } catch (error) {
                    console.error('❌ Error al expulsar al usuario:', error);
                }
                break;

            case 'warn':
                try {
                    const warningCount = await incrementWarningCount(chatId, senderId);
                    
                    if (warningCount >= 3) {
                        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                        await resetWarningCount(chatId, senderId); // Resetear por si vuelve a entrar
                        await sock.sendMessage(chatId, {
                            text: `╭━━━⊱ 👢 *EXPULSIÓN AUTOMÁTICA* ⊱━━━╮
│
│  👤 *Expulsado:* ${userMention}
│  ⚠️ *Motivo:* 3ª Advertencia por 
│  malas palabras.
│
│  🛡️ Grupo protegido automáticamente 
│  por ${BOT_NAME}.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                            mentions: [senderId]
                            });
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `╭━━━⊱ ⚠️ *ADVERTENCIA ${warningCount}/3* ⊱━━━╮
│
│  👤 *Usuario:* ${userMention}
│  📝 *Motivo:* Lenguaje inapropiado.
│
│  🚨 Tu mensaje fue eliminado. A la 
│  tercera advertencia serás expulsado 
│  automáticamente.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                            mentions: [senderId]
                        });
                    }
                } catch (error) {
                    console.error('❌ Error en el sistema de advertencias:', error);
                    // Fallback: si falla el contador, al menos avisamos
                    await sock.sendMessage(chatId, {
                        text: `╭━━━⊱ 🚫 *MENSAJE ELIMINADO* ⊱━━━╮
│
│  👤 *Usuario:* ${userMention}
│  📝 *Motivo:* Lenguaje inapropiado.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                        mentions: [senderId]
                    });
                }
                break;
        }
    } catch (error) {
        console.error('❌ Error crítico en handleBadwordDetection:', error);
    }
}

module.exports = {
    handleAntiBadwordCommand,
    handleBadwordDetection
};