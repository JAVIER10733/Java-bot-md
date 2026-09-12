/**
 * Java Bot MD - Juego del Ahorcado (.hangman / .guess)
 * Un clásico juego de adivinanzas con diseño visual ASCII y más de 100 palabras.
 */

const WORDS = [
    'javascript', 'bot', 'whatsapp', 'nodejs', 'python', 'servidor', 'codigo',
    'internet', 'teclado', 'pantalla', 'mouse', 'monitor', 'laptop', 'wifi',
    'perro', 'gato', 'elefante', 'jirafa', 'tigre', 'leon', 'aguila', 'tiburon',
    'computadora', 'celular', 'tablet', 'auriculares', 'camara', 'impresora',
    'mesa', 'silla', 'lampara', 'ventana', 'puerta', 'espejo', 'alfombra',
    'madrid', 'quito', 'bogota', 'lima', 'mexico', 'caracas', 'buenosaires',
    'playa', 'montaña', 'bosque', 'desierto', 'rio', 'lago', 'oceano', 'isla',
    'pizza', 'hamburguesa', 'tacos', 'sushi', 'ensalada', 'pasta', 'helado',
    'futbol', 'baloncesto', 'tenis', 'natacion', 'ciclismo', 'atletismo',
    'guitarra', 'piano', 'bateria', 'violin', 'trompeta', 'flauta', 'canto',
    'libro', 'revista', 'periodico', 'biblioteca', 'escuela', 'universidad',
    'doctor', 'enfermera', 'profesor', 'ingeniero', 'artista', 'musico',
    'sol', 'luna', 'estrella', 'planeta', 'galaxia', 'universo', 'cometa',
    'rojo', 'azul', 'verde', 'amarillo', 'naranja', 'morado', 'blanco', 'negro',
    'feliz', 'triste', 'enojado', 'sorprendido', 'asustado', 'cansado', 'emocionado'
];

// Almacén de juegos activos por chat
const hangmanGames = {};

/**
 * Dibuja el estado actual del ahorcado usando ASCII art.
 */
function getHangmanDrawing(wrongGuesses, maxWrongGuesses) {
    const stages = [
        // 0 errores
        `
   +---+
   |   |
       |
       |
       |
       |
=========`,
        // 1 error
        `
   +---+
   |   |
   O   |
       |
       |
       |
=========`,
        // 2 errores
        `
   +---+
   |   |
   O   |
   |   |
       |
       |
=========`,
        // 3 errores
        `
   +---+
   |   |
   O   |
  /|   |
       |
       |
=========`,
        // 4 errores
        `
   +---+
   |   |
   O   |
  /|\\ |
       |
       |
=========`,
        // 5 errores
        `
   +---+
   |   |
   O   |
  /|\\ |
  /    |
       |
=========`,
        // 6 errores (Game Over)
        `
   +---+
   |   |
   O   |
  /|\\ |
  / \\ |
       |
=========`
    ];
    return stages[Math.min(wrongGuesses, maxWrongGuesses)];
}

/**
 * Inicia un nuevo juego del ahorcado en el chat especificado.
 */
function startHangman(sock, chatId) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // Si ya hay un juego en este chat, lo terminamos primero
        if (hangmanGames[chatId]) {
            delete hangmanGames[chatId];
        }

        const word = WORDS[Math.floor(Math.random() * WORDS.length)].toLowerCase();
        const maskedWord = '_ '.repeat(word.length).trim();

        hangmanGames[chatId] = {
            word,
            maskedWord: maskedWord.split(' '),
            guessedLetters: [],
            wrongGuesses: 0,
            maxWrongGuesses: 6,
        };

        const helpMessage = `╭━━━⊱ 🎮 *AHORCADO* ⊱━━━╮
│
│  ¡Nuevo juego iniciado!
│  Adivina la palabra antes de que
│  el muñeco sea completado.
│
│  💡 *Uso:* .guess <letra>
│  💡 *Ejemplo:* .guess a
│
│  🔤 *Palabra:* ${maskedWord}
│
${getHangmanDrawing(0, 6)}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return sock.sendMessage(chatId, {
            text: helpMessage,
            footer: `🤖 ${botName} | Juegos interactivos`,
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

    } catch (error) {
        console.error('❌ Error al iniciar el ahorcado:', error);
    }
}

/**
 * Procesa el intento de adivinar una letra.
 */
function guessLetter(sock, chatId, letter) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        if (!hangmanGames[chatId]) {
            return sock.sendMessage(chatId, { 
                text: '⚠️ No hay ningún juego activo en este momento. Escribe *.hangman* para empezar uno nuevo.' 
            });
        }

        const game = hangmanGames[chatId];
        const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;
        const cleanLetter = letter.toLowerCase().trim();

        // Validaciones básicas
        if (cleanLetter.length !== 1 || !/[a-zñ]/.test(cleanLetter)) {
            return sock.sendMessage(chatId, { text: '❌ Por favor, introduce una sola letra válida (a-z, ñ).' });
        }

        if (guessedLetters.includes(cleanLetter)) {
            return sock.sendMessage(chatId, { text: `⚠️ Ya intentaste la letra *"${cleanLetter}"*. Prueba con otra.` });
        }

        guessedLetters.push(cleanLetter);
        let correctGuess = false;

        // Verificar si la letra está en la palabra
        for (let i = 0; i < word.length; i++) {
            if (word[i] === cleanLetter) {
                maskedWord[i] = cleanLetter;
                correctGuess = true;
            }
        }

        const currentWordDisplay = maskedWord.join(' ');
        const drawing = getHangmanDrawing(game.wrongGuesses + (correctGuess ? 0 : 1), maxWrongGuesses);

        if (correctGuess) {
            // Mensaje de acierto
            sock.sendMessage(chatId, { 
                text: `✅ ¡Bien hecho! La letra *"${cleanLetter}"* está en la palabra.\n\n🔤 *Palabra:* ${currentWordDisplay}\n\n${drawing}` 
            });

            // Verificar victoria
            if (!maskedWord.includes('_')) {
                delete hangmanGames[chatId];
                return sock.sendMessage(chatId, {
                    text: `╭━━━⊱ 🏆 *¡VICTORIA!* ⊱━━━╮
│
│  🎉 ¡Felicidades! Adivinaste la palabra:
│  ✨ *${word.toUpperCase()}* ✨
│
│  Has salvado al muñeco del ahorcado.
│  ¿Quieres jugar otra vez? Escribe *.hangman*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${botName} | Juegos interactivos`,
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
            }
        } else {
            // Mensaje de fallo
            game.wrongGuesses += 1;
            const triesLeft = maxWrongGuesses - game.wrongGuesses;
            
            sock.sendMessage(chatId, { 
                text: `❌ ¡Oh no! La letra *"${cleanLetter}"* no está.\nTe quedan *${triesLeft}* intentos.\n\n🔤 *Palabra:* ${currentWordDisplay}\n\n${drawing}` 
            });

            // Verificar derrota
            if (game.wrongGuesses >= maxWrongGuesses) {
                delete hangmanGames[chatId];
                return sock.sendMessage(chatId, {
                    text: `╭━━━⊱ 💀 *GAME OVER* ⊱━━━╮
│
│  😞 El muñeco ha sido ahorcado.
│  La palabra era: *${word.toUpperCase()}*
│
│  ¡No te rindas! Inténtalo de nuevo
│  escribiendo *.hangman*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                    footer: `🤖 ${botName} | Juegos interactivos`,
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
            }
        }
    } catch (error) {
        console.error('❌ Error en guessLetter:', error);
    }
}

module.exports = { startHangman, guessLetter };