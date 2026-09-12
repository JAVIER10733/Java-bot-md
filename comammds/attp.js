const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { writeExifVid } = require('../lib/exif');

/**
 * Comando para generar stickers de texto parpadeante (.attp)
 */
async function attpCommand(sock, chatId, message) {
    try {
        // 1. Extraer el texto del mensaje
        const userMessage = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const text = userMessage.split(' ').slice(1).join(' ').trim();

        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 2. Validar que haya texto
        if (!text) {
            const helpMessage = `╭━━━⊱ ✨ *ATTP (TEXTO A STICKER)* ⊱━━━╮
│
│  Convierte tu texto en un sticker
│  animado con efecto parpadeante.
│
│  💡 *Uso:* .attp <tu texto>
│  💡 *Ejemplo:* .attp Hola Mundo
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: `🤖 ${botName} | Creatividad al instante`,
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

        // 3. Mostrar indicador de "escribiendo..."
        await sock.sendPresenceUpdate('composing', chatId);

        // 4. Generar el video parpadeante con FFmpeg
        const mp4Buffer = await renderBlinkingVideoWithFfmpeg(text);
        
        // 5. Convertir a sticker con metadatos
        const webpPath = await writeExifVid(mp4Buffer, { 
            packname: botName,
            author: 'ATTP Generator'
        });
        
        const webpBuffer = fs.readFileSync(webpPath);
        
        // Limpieza segura del archivo temporal
        try { 
            if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath); 
        } catch (_) {}

        // 6. Enviar el sticker
        await sock.sendMessage(chatId, { 
            sticker: webpBuffer 
        }, { quoted: message });

        // 7. Enviar mensaje de seguimiento con el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: `✨ ¡Sticker generado exitosamente!\n\n🎨 *Texto:* _${text}_`,
            footer: `🤖 ${botName} | Creatividad al instante`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        });

        // Detener indicador de escritura
        await sock.sendPresenceUpdate('paused', chatId);

    } catch (error) {
        console.error('❌ Error generando sticker ATTP:', error);
        await sock.sendPresenceUpdate('paused', chatId);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // Mensaje de error profesional con el botón del canal
        await sock.sendMessage(chatId, {
            text: `❌ *Error al generar el sticker*\n\nNo se pudo procesar el texto. Esto suele ocurrir si:\n• El texto es demasiado largo.\n• FFmpeg no está instalado o configurado correctamente en el servidor.\n\nPor favor, inténtalo con un texto más corto.`,
            footer: `🤖 ${botName} | Soporte técnico`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Reportar en el Canal',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });
    }
}

/**
 * Genera un video MP4 con texto parpadeante (Rojo, Azul, Verde) usando FFmpeg.
 */
function renderBlinkingVideoWithFfmpeg(text) {
    return new Promise((resolve, reject) => {
        // Rutas de fuentes comunes (Windows / Linux)
        const fontPath = process.platform === 'win32'
            ? 'C:/Windows/Fonts/arialbd.ttf'
            : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

        // Escapado robusto para filtros de FFmpeg (drawtext)
        const escapeDrawtextText = (s) => s
            .replace(/\\/g, '\\\\')
            .replace(/:/g, '\\:')
            .replace(/,/g, '\\,')
            .replace(/'/g, "\\'")
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/%/g, '\\%');

        const safeText = escapeDrawtextText(text);
        const safeFontPath = process.platform === 'win32'
            ? fontPath.replace(/\\/g, '/').replace(':', '\\:')
            : fontPath;

        // Ciclo de parpadeo (segundos) y duración total
        const cycle = 0.3;
        const dur = 1.8; // 6 ciclos de parpadeo

        // Filtros para cambiar de color (Rojo -> Azul -> Verde)
        const drawRed = `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=red:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='lt(mod(t\\,${cycle})\\,0.1)'`;
        const drawBlue = `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=blue:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(mod(t\\,${cycle})\\,0.1\\,0.2)'`;
        const drawGreen = `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=green:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='gte(mod(t\\,${cycle})\\,0.2)'`;

        const filter = `${drawRed},${drawBlue},${drawGreen}`;

        const args = [
            '-y',
            '-f', 'lavfi',
            '-i', `color=c=black:s=512x512:d=${dur}:r=20`,
            '-vf', filter,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart+frag_keyframe+empty_moov',
            '-t', String(dur),
            '-f', 'mp4',
            'pipe:1'
        ];

        const ff = spawn('ffmpeg', args);
        const chunks = [];
        const errors = [];

        ff.stdout.on('data', d => chunks.push(d));
        ff.stderr.on('data', e => errors.push(e));
        
        ff.on('error', (err) => {
            reject(new Error(`FFmpeg falló al iniciar: ${err.message}. Asegúrate de que FFmpeg esté instalado en el sistema.`));
        });

        ff.on('close', code => {
            if (code === 0) {
                return resolve(Buffer.concat(chunks));
            }
            const errorMsg = Buffer.concat(errors).toString() || `FFmpeg salió con el código ${code}`;
            reject(new Error(`Error de FFmpeg: ${errorMsg}`));
        });
    });
}

module.exports = attpCommand;