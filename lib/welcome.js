const { addWelcome, delWelcome, isWelcomeOn, addGoodbye, delGoodBye, isGoodByeOn } = require('../lib/index');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

/**
 * Java Bot MD - Comando para configurar mensajes de Bienvenida (.welcome)
 */
async function handleWelcome(sock, chatId, message, match) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Bienvenida`,
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

        const args = match ? match.trim().split(' ') : [];
        const command = args[0]?.toLowerCase();
        const customMessage = args.slice(1).join(' ').trim();

        // 2. Mostrar menú de ayuda si no hay argumentos
        if (!command) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 👋 *CONFIGURAR BIENVENIDA* ⊱━━━╮
│
│  Personaliza el mensaje que el bot 
│  envía cuando alguien se une al grupo.
│
│  ⚙️ *Comandos disponibles:*
│  • *.welcome on*      → Activar (mensaje por defecto)
│  • *.welcome off*     → Desactivar
│  • *.welcome set* <texto> → Establecer mensaje personalizado
│
│  📌 *Variables disponibles:*
│  • {user} → Menciona al nuevo miembro
│  • {group} → Nombre del grupo
│  • {description} → Descripción del grupo
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Bienvenida`,
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

        // 3. Activar
        if (command === 'on') {
            if (await isWelcomeOn(chatId)) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ Los mensajes de bienvenida ya están *activados* en este grupo.' 
                }, { quoted: message });
            }
            await addWelcome(chatId, true, '╭━━━⊱ 👋 *¡BIENVENIDO/A!* ⊱━━━╮\n│\n│  🎉 Hola *{user}*, nos alegra que te\n│  unas a nuestra comunidad.\n│\n│  👥 *Grupo:* {group}\n│  📜 *Normas:* _{description}_\n│\n│  ¡Disfruta tu estancia!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯');
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ✅ *BIENVENIDA ACTIVADA* ⊱━━━╮
│
│  👋 El sistema de bienvenida ha sido 
│  activado con el mensaje por defecto.
│
│  💡 Usa *.welcome set <tu mensaje>* 
│  para personalizarlo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Bienvenida`,
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

        // 4. Desactivar
        if (command === 'off') {
            if (!(await isWelcomeOn(chatId))) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ Los mensajes de bienvenida ya están *desactivados*.' 
                }, { quoted: message });
            }
            await delWelcome(chatId);
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ 🚫 *BIENVENIDA DESACTIVADA* ⊱━━━╮
│
│  El bot ya no enviará mensajes de 
│  bienvenida cuando alguien se una.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Bienvenida`,
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

        // 5. Establecer mensaje personalizado
        if (command === 'set') {
            if (!customMessage) {
                return await sock.sendMessage(chatId, { 
                    text: `⚠️ Por favor, proporciona un mensaje personalizado.\n\n💡 *Ejemplo:* .welcome set ¡Hola {user}! Bienvenido a {group}.` 
                }, { quoted: message });
            }
            await addWelcome(chatId, true, customMessage);
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ✅ *MENSAJE PERSONALIZADO* ⊱━━━╮
│
│  📝 El mensaje de bienvenida ha sido 
│  actualizado exitosamente.
│
│  🔍 *Vista previa:*
│  _${customMessage}_
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Bienvenida`,
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

        // 6. Comando no reconocido
        return await sock.sendMessage(chatId, { 
            text: '❌ *Comando no reconocido.*\n\nEscribe *.welcome* sin argumentos para ver el menú de ayuda.' 
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en handleWelcome:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al configurar la bienvenida. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

/**
 * Java Bot MD - Comando para configurar mensajes de Despedida (.goodbye)
 */
async function handleGoodbye(sock, chatId, message, match) {
    try {
        // 1. Validar que sea un grupo
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR* ⊱━━━╮
│
│  Este comando solo se puede usar 
│  dentro de un *grupo*.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Despedida`,
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

        const args = match ? match.trim().split(' ') : [];
        const command = args[0]?.toLowerCase();
        const customMessage = args.slice(1).join(' ').trim();

        // 2. Mostrar menú de ayuda si no hay argumentos
        if (!command) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 👋 *CONFIGURAR DESPEDIDA* ⊱━━━╮
│
│  Personaliza el mensaje que el bot 
│  envía cuando alguien abandona el grupo.
│
│  ⚙️ *Comandos disponibles:*
│  • *.goodbye on*      → Activar (mensaje por defecto)
│  • *.goodbye off*     → Desactivar
│  • *.goodbye set* <texto> → Establecer mensaje personalizado
│
│  📌 *Variables disponibles:*
│  • {user} → Menciona al miembro que se va
│  • {group} → Nombre del grupo
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Despedida`,
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

        // 3. Activar
        if (command === 'on') {
            if (await isGoodByeOn(chatId)) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ Los mensajes de despedida ya están *activados* en este grupo.' 
                }, { quoted: message });
            }
            await addGoodbye(chatId, true, '╭━━━⊱ 👋 *HASTA PRONTO* ⊱━━━╮\n│\n│  😢 *{user}* ha abandonado el grupo.\n│\n│  🏰 *Grupo:* {group}\n│\n│  ¡Gracias por haber sido parte de\n│  nuestra comunidad!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯');
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ✅ *DESPEDIDA ACTIVADA* ⊱━━━╮
│
│  👋 El sistema de despedida ha sido 
│  activado con el mensaje por defecto.
│
│  💡 Usa *.goodbye set <tu mensaje>* 
│  para personalizarlo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Despedida`,
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

        // 4. Desactivar
        if (command === 'off') {
            if (!(await isGoodByeOn(chatId))) {
                return await sock.sendMessage(chatId, { 
                    text: '⚠️ Los mensajes de despedida ya están *desactivados*.' 
                }, { quoted: message });
            }
            await delGoodBye(chatId);
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ 🚫 *DESPEDIDA DESACTIVADA* ⊱━━━╮
│
│  El bot ya no enviará mensajes de 
│  despedida cuando alguien se vaya.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Despedida`,
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

        // 5. Establecer mensaje personalizado
        if (command === 'set') {
            if (!customMessage) {
                return await sock.sendMessage(chatId, { 
                    text: `⚠️ Por favor, proporciona un mensaje personalizado.\n\n💡 *Ejemplo:* .goodbye set Adiós {user}, te extrañaremos.` 
                }, { quoted: message });
            }
            await addGoodbye(chatId, true, customMessage);
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ✅ *MENSAJE PERSONALIZADO* ⊱━━━╮
│
│  📝 El mensaje de despedida ha sido 
│  actualizado exitosamente.
│
│  🔍 *Vista previa:*
│  _${customMessage}_
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Despedida`,
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

        // 6. Comando no reconocido
        return await sock.sendMessage(chatId, { 
            text: '❌ *Comando no reconocido.*\n\nEscribe *.goodbye* sin argumentos para ver el menú de ayuda.' 
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en handleGoodbye:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al configurar la despedida. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

module.exports = { handleWelcome, handleGoodbye };