const fetch = require('node-fetch');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

/**
 * Java Bot MD - Comando de Mezcla de Emojis (.emojimix)
 * Combina dos emojis en un sticker único y de alta calidad usando Tenor API y FFmpeg.
 */
async function emojimixCommand(sock, chatId, msg) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Extraer y validar argumentos
        const text = msg.message?.conversation?.trim() || msg.message?.extendedTextMessage?.text?.trim() || '';
        const args = text.split(' ').slice(1);
        
        if (!args[0] || !text.includes('+')) {
            const helpMessage = `╭━━━⊱ 🎴 *MEZCLA DE EMOJIS* ⊱━━━╮
│
│  Combina dos emojis para crear un
│  sticker único y divertido.
│
│  💡 *Uso:* .emojimix <emoji1>+<emoji2>
│  💡 *Ejemplo:* .emojimix 😎+🥰
│  💡 *Ejemplo:* .emojimix 🔥+💧
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
            }, { quoted: msg });
        }

        let [emoji1, emoji2] = args[0].split('+').map(e => e.trim());

        // 2. Consultar la API de Tenor (Emoji Kitchen)
        const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            const errorMessage = `╭━━━⊱ ❌ *COMBINACIÓN NO VÁLIDA* ⊱━━━╮
│
│  🚫 Estos emojis no se pueden mezclar.
│  💡 *Prueba con otros:*
│  • .emojimix 😎+🥰
│  • .emojimix 🔥+💧
│  • .emojimix 👽+👻
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(chatId, {
                text: errorMessage,
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
            }, { quoted: msg });
        }

        // 3. Preparar directorio temporal de forma segura
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const tempFile = path.join(tmpDir, `temp_${Date.now()}.png`);
        const outputFile = path.join(tmpDir, `sticker_${Date.now()}.webp`);

        // 4. Descargar la imagen
        const imageResponse = await fetch(data.results[0].url);
        const buffer = await imageResponse.buffer();
        fs.writeFileSync(tempFile, buffer);

        // 5. Convertir a WebP con FFmpeg (optimizado para stickers de WhatsApp)
        const ffmpegCommand = `ffmpeg -y -i "${tempFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${outputFile}"`;
        
        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        if (!fs.existsSync(outputFile)) {
            throw new Error('FFmpeg no pudo generar el archivo de sticker.');
        }

        // 6. Enviar el sticker
        const stickerBuffer = fs.readFileSync(outputFile);
        await sock.sendMessage(chatId, { 
            sticker: stickerBuffer 
        }, { quoted: msg });

        // 7. Enviar mensaje de seguimiento con el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: `✨ ¡Mezcla creada exitosamente!\n\n🎨 *Emojis:* ${emoji1} + ${emoji2}`,
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

        // 8. Limpieza segura de archivos temporales
        try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        } catch (err) {
            console.warn('⚠️ Error limpiando archivos temporales:', err.message);
        }

    } catch (error) {
        console.error('❌ Error en emojimixCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, {
            text: `❌ *Error al mezclar emojis*\n\nNo se pudo procesar la combinación. Asegúrate de usar emojis válidos y separados por un signo *+*.\n\n💡 Ejemplo: *.emojimix* 😎+🥰`,
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
        }, { quoted: msg });
    }
}

module.exports = emojimixCommand;