const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    try {
        // Variables dinámicas para que coincidan con la configuración global de tu bot
        const botName = global.botname || settings.botName || 'Java Bot MD';
        const version = settings.version || '4.0.0';
        const mode = settings.commandMode !== 'private' ? 'Público 🌍' : 'Privado 🔒';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // Diseño profesional tipo "Tarjeta" con emojis consistentes
        const aliveMessage = `╭━━━⊱ 🤖 *${botName}* ⊱━━━╮
│ ✨ *Estado:* 🟢 En línea y operativo
│ ⚙️ *Versión:* ${version}
│ 🌐 *Modo:* ${mode}
╰━━━━━━━━━━━━━━━━━━╯

🌟 *Características Principales:*
• 🛡️ Protección Antilink y Anti-spam
• 👑 Administración avanzada de grupos
• 🎨 Generación de imágenes, logos y stickers
• 🤖 Inteligencia Artificial (GPT, Gemini, etc.)
• 🎮 Juegos interactivos y diversión

💡 Escribe *.menu* o *.help* para ver la lista completa de comandos.`;

        // Envío del mensaje con el BOTÓN REAL (sin el banner molesto de reenvío)
        await sock.sendMessage(chatId, {
            text: aliveMessage,
            footer: '📢 ¡Mantente actualizado con las últimas novedades!',
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }
            ],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en el comando alive:', error);
        // Fallback simple por si algo falla inesperadamente
        await sock.sendMessage(chatId, { 
            text: '✅ ¡El bot está vivo, conectado y funcionando correctamente!' 
        }, { quoted: message });
    }
}

module.exports = aliveCommand;