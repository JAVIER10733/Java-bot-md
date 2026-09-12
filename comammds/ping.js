const os = require('os');
const settings = require('../settings.js');

/**
 * Convierte segundos en un formato legible y elegante.
 */
function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;
    const hours = Math.floor(seconds / (60 * 60));
    seconds %= 60 * 60;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

/**
 * Convierte bytes a un formato legible (MB o GB).
 */
function formatBytes(bytes) {
    const gb = bytes / 1024 ** 3;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

/**
 * Comando de ping/estado. Mide la latencia y muestra un panel de control profesional.
 */
async function pingCommand(sock, chatId, message) {
    const start = Date.now();
    const botName = global.botname || settings.botName || 'Java Bot MD';
    const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

    try {
        // 1. Mensaje inicial de carga (mejora la percepción de velocidad)
        const loadingMsg = await sock.sendMessage(chatId, { 
            text: '⏳ *Midiendo rendimiento del sistema...*' 
        }, { quoted: message });

        const ping = Date.now() - start;
        
        // 2. Recopilación de datos del sistema y del bot
        const uptime = formatTime(process.uptime());
        const botRam = formatBytes(process.memoryUsage().rss); // RAM que usa SOLO el bot
        const sysRamUsed = formatBytes(os.totalmem() - os.freemem()); // RAM total usada en el servidor
        const sysRamTotal = formatBytes(os.totalmem());
        const memPercent = (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1);

        // 3. Diseño profesional tipo "Panel de Control"
        const statusMessage = `╭━━━⊱ 🚀 *ESTADO DEL SISTEMA* ⊱━━━╮
│
│ ⚡ *Latencia (Ping):* ${ping} ms
│ ⏱️ *Tiempo Activo:* ${uptime}
│ 🤖 *RAM del Bot:* ${botRam}
│ 💻 *RAM del Sistema:* ${sysRamUsed} / ${sysRamTotal} (${memPercent}%)
│ 🖥️ *Sistema Operativo:* ${os.platform()} (${os.arch()})
│ 🟢 *Versión Node.js:* ${process.version}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

✅ *${botName}* está funcionando a la perfección.`;

        // 4. Eliminar el mensaje de "cargando" para mantener el chat limpio (opcional pero recomendado)
        try {
            await sock.sendMessage(chatId, { delete: loadingMsg.key });
        } catch (e) {
            // Si falla el borrado, no pasa nada, continuamos
        }

        // 5. Enviar el panel final con el BOTÓN REAL (sin banners molestos)
        await sock.sendMessage(chatId, {
            text: statusMessage,
            footer: `⚡ Respuesta en ${ping}ms | ${botName}`,
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
        console.error('❌ Error en el comando ping:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error al obtener el estado del bot. Inténtalo de nuevo.' 
        }, { quoted: message });
    }
}

module.exports = pingCommand;