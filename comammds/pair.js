const axios = require('axios');
const { sleep } = require('../lib/myfunc');

/**
 * Java Bot MD - Comando de Código de Vinculación (.pair)
 * Genera el código de 8 dígitos para vincular un número de WhatsApp al bot.
 */
async function pairCommand(sock, chatId, message, q) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Validar que se haya proporcionado un número
        if (!q || q.trim() === '') {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 📱 *CÓDIGO DE VINCULACIÓN* ⊱━━━╮
│
│  Genera el código de 8 dígitos para 
│  vincular tu número a este bot.
│
│  💡 *Uso:* .pair <número_con_código_de_país>
│  💡 *Ejemplo:* .pair 593991234567
│
│  ⚠️ *Nota:* No incluyas el signo '+' 
│  ni espacios en el número.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Soporte y Vinculación`,
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

        // 2. Procesar y validar el formato del número
        const numbers = q.split(',')
            .map((v) => v.replace(/[^0-9]/g, ''))
            .filter((v) => v.length >= 10 && v.length <= 15); // Longitud realista para números internacionales

        if (numbers.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: '❌ *Número inválido.*\n\nAsegúrate de incluir el código de país (ej: 593 para Ecuador) sin el signo "+" ni espacios.' 
            }, { quoted: message });
        }

        const number = numbers[0]; // Procesamos el primer número válido
        const whatsappID = `${number}@s.whatsapp.net`;

        // 3. Verificar si el número está registrado en WhatsApp
        const result = await sock.onWhatsApp(whatsappID);
        if (!result[0]?.exists) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Número no registrado.*\n\nEl número +${number} no tiene una cuenta de WhatsApp asociada. Verifica el código de país.` 
            }, { quoted: message });
        }

        // 4. Reacción de procesamiento (más limpio que enviar un mensaje de "espera")
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // 5. Solicitar el código a la API
        try {
            const response = await axios.get(`https://knight-bot-paircode.onrender.com/code?number=${number}`, {
                timeout: 15000 // 15 segundos de límite para evitar bloqueos infinitos
            });
            
            if (response.data && response.data.code && response.data.code !== "Service Unavailable") {
                const code = response.data.code;
                
                // Pequeña pausa para simular procesamiento y evitar rate limits
                await sleep(2000);

                // 6. Enviar el código con diseño premium y botón CTA
                await sock.sendMessage(chatId, {
                    text: `╭━━━⊱ ✅ *CÓDIGO GENERADO* ⊱━━━╮
│
│  📱 *Número:* +${number}
│  🔑 *Código:* **${code}**
│
│  📌 *Instrucciones:*
│  1. Abre WhatsApp en tu teléfono.
│  2. Ve a *Ajustes > Dispositivos vinculados*.
│  3. Toca *"Vincular un dispositivo"*.
│  4. Selecciona *"Vincular con número de teléfono"*.
│  5. Ingresa el código de arriba.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🚀 ¡Tu bot estará listo en segundos!`,
                    footer: `🤖 ${botName} | Vinculación segura`,
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

                // 7. Reacción de éxito
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

            } else {
                throw new Error('Service Unavailable');
            }
        } catch (apiError) {
            console.error('❌ Error en la API de vinculación:', apiError.message);
            
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *SERVICIO NO DISPONIBLE* ⊱━━━╮
│
│  El generador de códigos está 
│  temporalmente saturado o en 
│  mantenimiento.
│
│  💡 *Consejo:* Intenta de nuevo en 
│  unos minutos o usa el código QR 
│  si está disponible.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
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

    } catch (error) {
        console.error('❌ Error general en pairCommand:', error);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ *Error inesperado*\n\nOcurrió un problema al procesar tu solicitud. Por favor, verifica tu conexión e inténtalo de nuevo.`,
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

module.exports = pairCommand;