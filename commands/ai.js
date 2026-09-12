const axios = require('axios');
const fetch = require('node-fetch');

async function aiCommand(sock, chatId, message) {
    try {
        // 1. Extraer el texto de forma robusta (compatible con smsg y mensajes crudos)
        const fullText = message.body || message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        
        // 2. Separar comando y consulta
        const parts = fullText.trim().split(/\s+/);
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        // 3. Validar que haya una pregunta
        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: `⚠️ Por favor, escribe tu pregunta o instrucción.\n\n💡 *Ejemplo:* \`.gpt escribe un código HTML básico\`\n💡 *Ejemplo:* \`.gemini ¿Cuál es la capital de Francia?\``
            }, { quoted: message });
        }

        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 4. Mostrar indicador de "escribiendo..." para mejor experiencia de usuario
        await sock.sendPresenceUpdate('composing', chatId);

        let answer = "";

        try {
            if (command === '.gpt') {
                // Llamada a la API de GPT
                const response = await axios.get(`https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`, {
                    timeout: 15000 // 15 segundos de tiempo límite
                });
                
                if (response.data?.status && response.data?.result) {
                    answer = response.data.result;
                } else {
                    throw new Error('Respuesta inválida de la API de GPT');
                }

            } else if (command === '.gemini') {
                // Lista de APIs de respaldo para Gemini (si una falla, prueba la siguiente)
                const apis = [
                    `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
                    `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
                    `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,
                    `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`
                ];

                let apiSuccess = false;
                for (const api of apis) {
                    try {
                        const response = await fetch(api, { timeout: 15000 });
                        const data = await response.json();

                        // Buscar la respuesta en cualquiera de los formatos comunes de estas APIs
                        const possibleAnswers = [data.message, data.data, data.answer, data.result, data.response];
                        const validAnswer = possibleAnswers.find(a => typeof a === 'string' && a.trim() !== '');

                        if (validAnswer) {
                            answer = validAnswer;
                            apiSuccess = true;
                            break; // ¡Éxito! Salimos del bucle
                        }
                    } catch (e) {
                        // Si falla esta API, el bucle continúa con la siguiente automáticamente
                        continue;
                    }
                }

                if (!apiSuccess) {
                    throw new Error('Todos los servicios de IA están ocupados o caídos en este momento.');
                }
            } else {
                throw new Error('Comando de IA no reconocido.');
            }

        } catch (apiError) {
            console.error('❌ Error de API en IA:', apiError.message);
            throw new Error('No pude conectar con el cerebro de la IA. Inténtalo de nuevo en unos segundos.');
        } finally {
            // Detener el indicador de "escribiendo..."
            await sock.sendPresenceUpdate('paused', chatId);
        }

        // 5. Diseño profesional tipo "Tarjeta" para la respuesta
        // Limitamos la longitud de la pregunta en el encabezado para que no se vea desordenado
        const shortQuery = query.length > 60 ? query.substring(0, 60) + '...' : query;

        const formattedMessage = `╭━━━⊱ 🤖 *INTELIGENCIA ARTIFICIAL* ⊱━━━╮
│
│ 💬 *Pregunta:* _${shortQuery}_
│ 
│ 📝 *Respuesta:*
│ ${answer}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🧠 *Powered by ${botName}*`;

        // 6. Envío del mensaje con el BOTÓN REAL (sin banners molestos)
        await sock.sendMessage(chatId, {
            text: formattedMessage,
            footer: `⚡ Respuesta generada en tiempo real`,
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }
            ],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error general en AI Command:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ Ocurrió un error al procesar tu solicitud: ${error.message || 'Inténtalo de nuevo más tarde.'}`
        }, { quoted: message });
    }
}

module.exports = aiCommand;