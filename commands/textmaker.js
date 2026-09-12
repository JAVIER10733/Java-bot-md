const mumaker = require('mumaker');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

// Mapa de efectos para un código limpio, escalable y fácil de mantener.
const EFFECTS = {
    metallic: 'https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html',
    ice: 'https://en.ephoto360.com/ice-text-effect-online-101.html',
    snow: 'https://en.ephoto360.com/create-a-snow-3d-text-effect-free-online-621.html',
    impressive: 'https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html',
    matrix: 'https://en.ephoto360.com/matrix-text-effect-154.html',
    light: 'https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html',
    neon: 'https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html',
    devil: 'https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html',
    purple: 'https://en.ephoto360.com/purple-text-effect-online-100.html',
    thunder: 'https://en.ephoto360.com/thunder-text-effect-online-97.html',
    leaves: 'https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html',
    '1917': 'https://en.ephoto360.com/1917-style-text-effect-523.html',
    arena: 'https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html',
    hacker: 'https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html',
    sand: 'https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html',
    blackpink: 'https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html',
    glitch: 'https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html',
    fire: 'https://en.ephoto360.com/flame-lettering-effect-372.html'
};

/**
 * Java Bot MD - Comando de Generación de Textos con Efectos (.metallic, .neon, etc.)
 * Crea logos y textos estilizados usando la API de ePhoto360.
 */
async function textmakerCommand(sock, chatId, message, q, type) {
    try {
        // 1. Limpiar el texto de entrada
        const cleanText = q ? q.replace(new RegExp(`^\\.?${type}\\s*`, 'i'), '').trim() : '';

        // 2. Validar que haya texto
        if (!cleanText) {
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ 🎨 *GENERADOR DE TEXTO* ⊱━━━╮
│
│  Crea logos y textos con efectos 
│  impresionantes en segundos.
│
│  💡 *Uso:* .${type} <tu texto>
│  💡 *Ejemplo:* .${type} Java Bot MD
│
│  ⚠️ *Nota:* Evita caracteres especiales 
│  excesivos o textos demasiado largos.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Creatividad`,
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

        // 3. Validar longitud del texto (las APIs de ePhoto360 suelen fallar con textos muy largos)
        if (cleanText.length > 50) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Texto demasiado largo.*\n\nPor favor, usa un texto de máximo 50 caracteres para garantizar una buena generación.',
                footer: `🤖 ${BOT_NAME} | Creatividad`,
                buttons: [{ 
                    name: 'cta_url', 
                    buttonParamsJson: JSON.stringify({ display_text: '📢 Únete a mi Canal Oficial', url: CHANNEL_LINK, merchant_url: CHANNEL_LINK }) 
                }],
                headerType: 1
            }, { quoted: message });
        }

        // 4. Verificar si el efecto existe
        const effectType = type.toLowerCase();
        const effectUrl = EFFECTS[effectType];
        
        if (!effectUrl) {
            return await sock.sendMessage(chatId, { 
                text: `╭━━━⊱ ❌ *EFECTO NO VÁLIDO* ⊱━━━╮
│
│  El efecto "*${type}*" no está disponible.
│
│  🎨 *Efectos disponibles:*
│  ${Object.keys(EFFECTS).map(e => `• ${e}`).join('\n  ')}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Creatividad`,
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

        // 5. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });

        // 6. Llamar a la API de generación
        const result = await mumaker.ephoto(effectUrl, cleanText);

        if (!result || !result.image) {
            throw new Error('La API no devolvió una imagen válida.');
        }

        // 7. Enviar la imagen con diseño premium y botón CTA
        await sock.sendMessage(chatId, { 
            image: { url: result.image }, 
            caption: `╭━━━⊱ ✨ *TEXTO GENERADO* ⊱━━━╮
│
│  📝 *Texto:* _${cleanText}_
│  🎨 *Efecto:* ${effectType.toUpperCase()}
│
│  🤖 Generado por *${BOT_NAME}*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${BOT_NAME} | Creatividad`,
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

        // 8. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error(`❌ Error en textmaker (${type}):`, error.message);
        
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { 
            text: `╭━━━⊱ ❌ *ERROR DE GENERACIÓN* ⊱━━━╮
│
│  Ocurrió un problema al crear la imagen.
│
│  💡 *Posibles causas:*
│  • El servidor de efectos está saturado.
│  • El texto contiene caracteres no 
│    soportados por este efecto específico.
│
│  Intenta con otro texto o efecto.
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
        }, { quoted: message });
    }
}

module.exports = textmakerCommand;