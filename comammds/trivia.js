const axios = require('axios');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

// Almacén de juegos de trivia activos por chat
const triviaGames = {};

/**
 * Decodifica entidades HTML básicas (la API de OpenTDB las devuelve así).
 */
function decodeHtml(html) {
    return html.replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

/**
 * Java Bot MD - Comando para iniciar una Trivia (.trivia)
 */
async function startTrivia(sock, chatId, message) {
    try {
        // 1. Validar si ya hay un juego en progreso
        if (triviaGames[chatId]) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ⚠️ *JUEGO EN PROGRESO* ⊱━━━╮
│
│  Ya hay una partida de Trivia 
│  activa en este grupo.
│
│  💡 *Espera a que termine* o 
│  responde con la respuesta correcta.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Juegos Interactivos`,
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

        // 2. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🧠', key: message?.key } });

        // 3. Obtener pregunta de OpenTDB (con timeout de 10s)
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', {
            timeout: 10000
        });
        
        const questionData = response.data.results[0];
        const question = decodeHtml(questionData.question);
        const correctAnswer = decodeHtml(questionData.correct_answer);
        const incorrectAnswers = questionData.incorrect_answers.map(decodeHtml);
        
        // Mezclar opciones aleatoriamente
        const options = [...incorrectAnswers, correctAnswer].sort(() => Math.random() - 0.5);
        const letters = ['A', 'B', 'C', 'D'];
        const optionsText = options.map((opt, i) => `  *${letters[i]}.* ${opt}`).join('\n');

        // 4. Guardar estado del juego
        triviaGames[chatId] = {
            question,
            correctAnswer: correctAnswer.toLowerCase().trim(),
            options,
            startTime: Date.now()
        };

        // 5. Enviar la pregunta con diseño premium
        const triviaMessage = `╭━━━⊱ 🧠 *HORA DE LA TRIVIA* ⊱━━━╮
│
│  📜 *Pregunta:*
│  _${question}_
│
│  📝 *Opciones:*
│  ${optionsText}
│
│  ⏱️ *Tiempo:* Tienes 60 segundos.
│  💡 *Uso:* Responde con la letra 
│  (A, B, C, D) o la respuesta completa.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(chatId, {
            text: triviaMessage,
            footer: `🤖 ${BOT_NAME} | Juegos Interactivos`,
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

        // 6. Temporizador de limpieza (evita fugas de memoria si nadie responde)
        setTimeout(() => {
            if (triviaGames[chatId]) {
                delete triviaGames[chatId];
            }
        }, 60000);

    } catch (error) {
        console.error('❌ Error en startTrivia:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message?.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE TRIVIA* ⊱━━━╮
│
│  No se pudo obtener una pregunta 
│  en este momento.
│
│  💡 *Posible causa:* La API de 
│  preguntas está saturada o sin 
│  conexión.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
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

/**
 * Java Bot MD - Comando para responder la Trivia (.answer o respuesta directa)
 */
async function answerTrivia(sock, chatId, message, answerText) {
    try {
        if (!triviaGames[chatId]) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ⚠️ *SIN JUEGO ACTIVO* ⊱━━━╮
│
│  No hay ninguna partida de Trivia 
│  en progreso en este momento.
│
│  💡 *Escribe* .trivia *para iniciar 
│  una nueva partida.*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${BOT_NAME} | Juegos Interactivos`,
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

        const game = triviaGames[chatId];
        const userAnswer = answerText.toLowerCase().trim();
        const correctAnswer = game.correctAnswer;
        
        // Mapeo de letras a opciones para permitir respuestas como "A" o "B"
        const letters = ['a', 'b', 'c', 'd'];
        const letterIndex = letters.indexOf(userAnswer);
        
        let isCorrect = false;

        if (letterIndex !== -1) {
            // El usuario respondió con una letra (A, B, C, D)
            const matchedOption = game.options[letterIndex].toLowerCase().trim();
            isCorrect = (matchedOption === correctAnswer);
        } else {
            // El usuario respondió con el texto completo
            isCorrect = (userAnswer === correctAnswer);
        }

        const correctOptionText = game.options.find(opt => opt.toLowerCase().trim() === correctAnswer);

        if (isCorrect) {
            await sock.sendMessage(chatId, { react: { text: '🎉', key: message.key } });
            const successMessage = `╭━━━⊱ 🏆 *¡RESPUESTA CORRECTA!* ⊱━━━╮
│
│  ✅ *Respuesta:* _${correctOptionText}_
│
│  🎉 ¡Felicidades! Has demostrado 
│  tener un gran conocimiento.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
            
            await sock.sendMessage(chatId, {
                text: successMessage,
                footer: `🤖 ${BOT_NAME} | Juegos Interactivos`,
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
        } else {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            const failMessage = `╭━━━⊱ 💀 *RESPUESTA INCORRECTA* ⊱━━━╮
│
│  ❌ *Tu respuesta:* _${answerText}_
│  ✅ *Respuesta correcta:* _${correctOptionText}_
│
│  😢 ¡Mejor suerte para la próxima! 
│  Sigue intentándolo.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            await sock.sendMessage(chatId, {
                text: failMessage,
                footer: `🤖 ${BOT_NAME} | Juegos Interactivos`,
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

        // Eliminar el juego después de responder (o si se acaba el tiempo)
        delete triviaGames[chatId];

    } catch (error) {
        console.error('❌ Error en answerTrivia:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message?.key } });
        await sock.sendMessage(chatId, {
            text: `❌ *Error al procesar tu respuesta.* Inténtalo de nuevo.`,
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

module.exports = { startTrivia, answerTrivia };