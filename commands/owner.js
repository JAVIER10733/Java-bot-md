const settings = require('../settings');

async function ownerCommand(sock, chatId, message) {
    try {
        // Soporta que ownerNumber sea string o array
        const ownerNum = Array.isArray(settings.ownerNumber)
            ? settings.ownerNumber[0]
            : settings.ownerNumber;

        const ownerName = settings.botOwner || 'Javier';
        const botName = global.botname || settings.botName || 'Java Bot MD';
        const version = settings.version || '4.0.0';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // ── 1. Enviar la vCard (tarjeta de contacto guardable) ──
        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${ownerName}`,
            `ORG:${botName} Development`,
            `TITLE:Creador & Desarrollador Principal`,
            `TEL;waid=${ownerNum}:${ownerNum}`,
            `NOTE:Dueño de ${botName} v${version}`,
            'END:VCARD'
        ].join('\n');

        await sock.sendMessage(chatId, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: message });

        // ── 2. Enviar mensaje de perfil del dueño con botón CTA ──
        const profileMessage = `╭━━━⊱ 👑 *DESARROLLADOR* ⊱━━━╮
│
│  🧑‍💻 *Nombre:* ${ownerName}
│  📱 *Número:* +${ownerNum}
│  🤖 *Proyecto:* ${botName}
│  ⚙️ *Versión:* ${version}
│  💼 *Rol:* Creador & Dev Principal
│
│  📌 *Sobre mí:*
│  Desarrollador del bot que estás
│  usando ahora mismo. Si tienes
│  dudas, sugerencias o quieres
│  reportar un bug, contáctame
│  con respeto. 🙏
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

⚠️ *Nota:* No spam al dueño.
Usa *.help* para comandos del bot.`;

        await sock.sendMessage(chatId, {
            text: profileMessage,
            footer: `🤖 ${botName} v${version} | Desarrollado por ${ownerName}`,
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete al Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }
            ],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error en el comando owner:', error);
        await sock.sendMessage(chatId, {
            text: `👑 Dueño: *${settings.botOwner || 'javier'}*\n📱 Número: ${settings.ownerNumber}`
        }, { quoted: message });
    }
}

module.exports = ownerCommand;