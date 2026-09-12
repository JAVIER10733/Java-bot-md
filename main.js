// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Auto-cleaner every 3 hours
setInterval(() => {
  fs.readdir(customTemp, (err, files) => {
    if (err) return;
    for (const file of files) {
      const filePath = path.join(customTemp, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
          fs.unlink(filePath, () => {});
        }
      });
    }
  });
  console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');
const axios = require('axios');
const { isSudo } = require('./lib/index');
const { autotypingCommand, handleAutotypingForMessage, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, handleAutoread } = require('./commands/autoread');

// Command imports
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand } = require('./commands/antilink');
const { Antilink } = require('./lib/antilink');
const { handleAntitagCommand } = require('./commands/antitag');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const { handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { handleAreactCommand, addCommandReaction } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const { anticallCommand } = require('./commands/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');

// Global settings
global.botname = settings.botName || 'Java Bot MD'; // CRÍTICO: Requerido por los nuevos comandos
global.packname = settings.packname || global.botname;
global.author = settings.author || 'Javier';
global.channelLink = "https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z";
global.ytch = "Mr Unique Hacker";

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        await handleAutoread(sock, message);

        if (message.message) {
            storeMessage(sock, message);
        }

        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        if (userMessage.startsWith('.')) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }

        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (error) {
            console.error('Error checking access mode:', error);
        }
        const isOwnerOrSudo = message.key.fromMe || senderIsSudo;

        if (isBanned(senderId) && !userMessage.startsWith('.unban')) {
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ Estás baneado de usar el bot. Contacta a un admin para que te desbanee.'
                });
            }
            return;
        }

        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            await Antilink(message, sock);
        }

        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    await sock.sendMessage(chatId, { text: pmState.message || 'Los mensajes privados están bloqueados. Por favor, contacta al dueño en los grupos.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        if (!userMessage.startsWith('.')) {
            await handleAutotypingForMessage(sock, chatId, userMessage);

            if (isGroup) {
                const { handleTagDetection } = require('./commands/antitag'); // Dynamic import to avoid circular dep if needed
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);
                
                if (isPublic || isOwnerOrSudo) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }
            return;
        }

        if (!isPublic && !isOwnerOrSudo) {
            return;
        }

        const adminCommands = ['.mute', '.unmute', '.ban', '.unban', '.promote', '.demote', '.kick', '.tagall', '.tagnotadmin', '.hidetag', '.antilink', '.antitag', '.setgdesc', '.setgname', '.setgpp'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        const ownerCommands = ['.mode', '.autostatus', '.antidelete', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.autotyping', '.autoread', '.pmblocker'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId, message);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Por favor, hazme administrador del grupo para usar comandos de administración.' }, { quoted: message });
                return;
            }

            if (
                userMessage.startsWith('.mute') ||
                userMessage === '.unmute' ||
                userMessage.startsWith('.ban') ||
                userMessage.startsWith('.unban') ||
                userMessage.startsWith('.promote') ||
                userMessage.startsWith('.demote')
            ) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, {
                        text: 'Lo siento, solo los administradores del grupo pueden usar este comando.'
                    }, { quoted: message });
                    return;
                }
            }
        }

        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsSudo) {
                await sock.sendMessage(chatId, { text: '❌ ¡Este comando solo está disponible para el dueño o sudo!' }, { quoted: message });
                return;
            }
        }

        let commandExecuted = false;

        switch (true) {
            case userMessage === '.simage' || userMessage === '.toimg':
                // CORREGIDO: Ahora pasa (sock, chatId, message) como espera el comando optimizado
                await simageCommand(sock, chatId, message);
                commandExecuted = true;
                break;
                
            case userMessage.startsWith('.kick'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
                
            case userMessage.startsWith('.mute'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const muteArg = parts[1];
                    const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                    if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
                        await sock.sendMessage(chatId, { text: 'Por favor, proporciona un número válido de minutos o usa .mute sin número para silenciar inmediatamente.' }, { quoted: message });
                    } else {
                        await muteCommand(sock, chatId, senderId, message, muteDuration);
                    }
                }
                break;
                
            case userMessage === '.unmute':
                await unmuteCommand(sock, chatId, senderId, message);
                break;
                
            case userMessage.startsWith('.ban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Solo el dueño/sudo puede usar .ban en chat privado.' }, { quoted: message });
                        break;
                    }
                }
                await banCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.unban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Solo el dueño/sudo puede usar .unban en chat privado.' }, { quoted: message });
                        break;
                    }
                }
                await unbanCommand(sock, chatId, message);
                break;
                
            case userMessage === '.help' || userMessage === '.menu' || userMessage === '.bot' || userMessage === '.list':
                await helpCommand(sock, chatId, message, global.channelLink);
                commandExecuted = true;
                break;
                
            case userMessage === '.sticker' || userMessage === '.s':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
                
            case userMessage.startsWith('.warnings'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, message, mentionedJidListWarnings);
                break;
                
            case userMessage.startsWith('.warn'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;
                
            case userMessage.startsWith('.tts'):
                const textTts = userMessage.slice(4).trim();
                await ttsCommand(sock, chatId, message); // El comando interno extrae el texto
                break;
                
            case userMessage.startsWith('.delete') || userMessage.startsWith('.del'):
                await deleteCommand(sock, chatId, message, senderId);
                break;
                
            case userMessage.startsWith('.attp'):
                await attpCommand(sock, chatId, message);
                break;
                
            case userMessage === '.settings':
                await settingsCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.mode'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '¡Solo el dueño del bot puede usar este comando!' }, { quoted: message });
                    return;
                }
                let dataMode;
                try {
                    dataMode = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Error al leer el estado del modo del bot.' });
                    return;
                }

                const action = userMessage.split(' ')[1]?.toLowerCase();
                if (!action) {
                    const currentMode = dataMode.isPublic ? 'público' : 'privado';
                    await sock.sendMessage(chatId, {
                        text: `Modo actual del bot: *${currentMode}*\n\nUso: .mode public/private\n\nEjemplo:\n.mode public - Permitir que todos usen el bot\n.mode private - Restringir solo al dueño`
                    }, { quoted: message });
                    return;
                }

                if (action !== 'public' && action !== 'private') {
                    await sock.sendMessage(chatId, {
                        text: 'Uso: .mode public/private\n\nEjemplo:\n.mode public - Permitir que todos usen el bot\n.mode private - Restringir solo al dueño'
                    }, { quoted: message });
                    return;
                }

                try {
                    dataMode.isPublic = action === 'public';
                    fs.writeFileSync('./data/messageCount.json', JSON.stringify(dataMode, null, 2));
                    await sock.sendMessage(chatId, { text: `El bot ahora está en modo *${action === 'public' ? 'público' : 'privado'}*` });
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Error al actualizar el modo de acceso del bot.' });
                }
                break;
                
            case userMessage.startsWith('.anticall'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Solo el dueño/sudo puede usar anticall.' }, { quoted: message });
                    break;
                }
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await anticallCommand(sock, chatId, message, args);
                }
                break;
                
            case userMessage.startsWith('.pmblocker'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Solo el dueño/sudo puede usar pmblocker.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await pmblockerCommand(sock, chatId, message, args);
                }
                commandExecuted = true;
                break;
                
            case userMessage === '.owner':
                await ownerCommand(sock, chatId, message);
                break;
                
            case userMessage === '.tagall':
                await tagAllCommand(sock, chatId, senderId, message);
                break;
                
            case userMessage === '.tagnotadmin':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;
                
            case userMessage.startsWith('.hidetag'):
                {
                    const messageText = rawText.slice(8).trim();
                    const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                    await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                }
                break;
                
            case userMessage.startsWith('.tag'):
                const messageTextTag = rawText.slice(4).trim();
                const replyMessageTag = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageTextTag, replyMessageTag, message);
                break;
                
            case userMessage.startsWith('.antilink'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Este comando solo se puede usar en grupos.' }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: 'Por favor, hazme administrador primero.' }, { quoted: message });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
                
            case userMessage.startsWith('.antitag'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Este comando solo se puede usar en grupos.' }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: 'Por favor, hazme administrador primero.' }, { quoted: message });
                    return;
                }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
                
            case userMessage === '.meme':
                await memeCommand(sock, chatId, message);
                break;
                
            case userMessage === '.joke':
                await jokeCommand(sock, chatId, message);
                break;
                
            case userMessage === '.quote':
                await quoteCommand(sock, chatId, message);
                break;
                
            case userMessage === '.fact':
                await factCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.weather'):
                const city = userMessage.slice(9).trim();
                if (city) {
                    await weatherCommand(sock, chatId, message, city);
                } else {
                    await sock.sendMessage(chatId, { text: 'Por favor, especifica una ciudad, ej: .weather Quito' }, { quoted: message });
                }
                break;
                
            case userMessage === '.news':
                await newsCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.ttt') || userMessage.startsWith('.tictactoe'):
                const tttText = userMessage.split(' ').slice(1).join(' ');
                await tictactoeCommand(sock, chatId, senderId, tttText);
                break;
                
            case userMessage.startsWith('.move'):
                const position = parseInt(userMessage.split(' ')[1]);
                if (isNaN(position)) {
                    await sock.sendMessage(chatId, { text: 'Por favor, proporciona un número de posición válido para el movimiento de Tic-Tac-Toe.' }, { quoted: message });
                } else {
                    await handleTicTacToeMove(sock, chatId, senderId, position.toString());
                }
                break;
                
            case userMessage === '.topmembers':
                topMembers(sock, chatId, message, isGroup);
                break;
                
            case userMessage.startsWith('.hangman'):
                startHangman(sock, chatId);
                break;
                
            case userMessage.startsWith('.guess'):
                const guessedLetter = userMessage.split(' ')[1];
                if (guessedLetter) {
                    guessLetter(sock, chatId, guessedLetter);
                } else {
                    await sock.sendMessage(chatId, { text: 'Por favor, adivina una letra usando .guess <letra>' }, { quoted: message });
                }
                break;
                
            case userMessage.startsWith('.trivia'):
                startTrivia(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.answer'):
                const answer = userMessage.split(' ').slice(1).join(' ');
                if (answer) {
                    answerTrivia(sock, chatId, message, answer);
                } else {
                    await sock.sendMessage(chatId, { text: 'Por favor, proporciona una respuesta usando .answer <respuesta>' }, { quoted: message });
                }
                break;
                
            case userMessage.startsWith('.compliment'):
                await complimentCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.insult'):
                await insultCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.8ball'):
                const question8 = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question8);
                break;
                
            case userMessage.startsWith('.lyrics'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                break;
                
            case userMessage.startsWith('.simp'):
                // CORREGIDO: Añadido 'message' al final para reacciones y citas
                const simpQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const simpMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, simpQuotedMsg, simpMentionedJid, senderId, message);
                break;
                
            case userMessage.startsWith('.stupid') || userMessage.startsWith('.itssostupid') || userMessage.startsWith('.iss'):
                // CORREGIDO: Añadido 'message' al final
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = userMessage.split(' ').slice(1);
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs, message);
                break;
                
            case userMessage === '.dare':
                await dareCommand(sock, chatId, message);
                break;
                
            case userMessage === '.truth':
                await truthCommand(sock, chatId, message);
                break;
                
            case userMessage === '.clear':
                if (isGroup) await clearCommand(sock, chatId);
                break;
                
            case userMessage.startsWith('.promote'):
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                break;
                
            case userMessage.startsWith('.demote'):
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                break;
                
            case userMessage === '.ping':
                await pingCommand(sock, chatId, message);
                break;
                
            case userMessage === '.alive':
                await aliveCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.mention '):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await mentionToggleCommand(sock, chatId, message, args, isOwner);
                }
                break;
                
            case userMessage === '.setmention':
                {
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await setMentionCommand(sock, chatId, message, isOwner);
                }
                break;
                
            case userMessage.startsWith('.blur'):
                const quotedMessageBlur = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessageBlur);
                break;
                
            case userMessage.startsWith('.welcome'):
                if (isGroup) {
                    if (isSenderAdmin || message.key.fromMe) {
                        await welcomeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Lo siento, solo los administradores del grupo pueden usar este comando.' }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'Este comando solo se puede usar en grupos.' }, { quoted: message });
                }
                break;
                
            case userMessage.startsWith('.goodbye'):
                if (isGroup) {
                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Lo siento, solo los administradores del grupo pueden usar este comando.' }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'Este comando solo se puede usar en grupos.' }, { quoted: message });
                }
                break;
                
            case userMessage === '.git' || userMessage === '.github' || userMessage === '.sc' || userMessage === '.script' || userMessage === '.repo':
                await miscCommand(sock, chatId, message, ['github']);
                break;
                
            case userMessage.startsWith('.antibadword'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Este comando solo se puede usar en grupos.' }, { quoted: message });
                    return;
                }
                const adminStatusBad = await isAdmin(sock, chatId, senderId, message);
                isSenderAdmin = adminStatusBad.isSenderAdmin;
                isBotAdmin = adminStatusBad.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '*El bot debe ser administrador para usar esta función*' }, { quoted: message });
                    return;
                }
                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
                
            case userMessage.startsWith('.chatbot'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Este comando solo se puede usar en grupos.' }, { quoted: message });
                    return;
                }
                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId, message);
                if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '*Solo los administradores o el dueño del bot pueden usar este comando*' }, { quoted: message });
                    return;
                }
                const matchChatbot = userMessage.slice(8).trim();
                await handleChatbotCommand(sock, chatId, message, matchChatbot);
                break;
                
            case userMessage.startsWith('.take') || userMessage.startsWith('.steal'):
                {
                    const isSteal = userMessage.startsWith('.steal');
                    const sliceLen = isSteal ? 6 : 5;
                    const takeArgs = rawText.slice(sliceLen).trim().split(' ');
                    await takeCommand(sock, chatId, message, takeArgs);
                }
                break;
                
            case userMessage === '.flirt':
                await flirtCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.character'):
                await characterCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.waste'):
                await wastedCommand(sock, chatId, message);
                break;
                
            case userMessage === '.ship':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '¡Este comando solo se puede usar en grupos!' }, { quoted: message });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;
                
            case userMessage === '.groupinfo' || userMessage === '.infogp' || userMessage === '.infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '¡Este comando solo se puede usar en grupos!' }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
                
            case userMessage === '.resetlink' || userMessage === '.revoke' || userMessage === '.anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '¡Este comando solo se puede usar en grupos!' }, { quoted: message });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId, message);
                break;
                
            case userMessage === '.staff' || userMessage === '.admins' || userMessage === '.listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '¡Este comando solo se puede usar en grupos!' }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.tourl') || userMessage.startsWith('.url'):
                await urlCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.emojimix') || userMessage.startsWith('.emix'):
                await emojimixCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.tg') || userMessage.startsWith('.stickertelegram') || userMessage.startsWith('.tgsticker') || userMessage.startsWith('.telesticker'):
                await stickerTelegramCommand(sock, chatId, message);
                break;
                
            case userMessage === '.vv':
                await viewOnceCommand(sock, chatId, message);
                break;
                
            case userMessage === '.clearsession' || userMessage === '.clearsesi':
                await clearSessionCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.autostatus'):
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;
                
            case userMessage.startsWith('.metallic') || userMessage.startsWith('.ice') || userMessage.startsWith('.snow') || userMessage.startsWith('.impressive') || userMessage.startsWith('.matrix') || userMessage.startsWith('.light') || userMessage.startsWith('.neon') || userMessage.startsWith('.devil') || userMessage.startsWith('.purple') || userMessage.startsWith('.thunder') || userMessage.startsWith('.leaves') || userMessage.startsWith('.1917') || userMessage.startsWith('.arena') || userMessage.startsWith('.hacker') || userMessage.startsWith('.sand') || userMessage.startsWith('.blackpink') || userMessage.startsWith('.glitch') || userMessage.startsWith('.fire'):
                const effectType = userMessage.split(' ')[0].slice(1);
                await textmakerCommand(sock, chatId, message, rawText, effectType);
                break;
                
            case userMessage.startsWith('.antidelete'):
                const antideleteMatch = userMessage.slice(11).trim();
                await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
                break;
                
            case userMessage === '.surrender':
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
                break;
                
            case userMessage === '.cleartmp':
                await clearTmpCommand(sock, chatId, message);
                break;
                
            case userMessage === '.setpp':
                await setProfilePicture(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.setgdesc'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupDescription(sock, chatId, senderId, text, message);
                }
                break;
                
            case userMessage.startsWith('.setgname'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupName(sock, chatId, senderId, text, message);
                }
                break;
                
            case userMessage.startsWith('.setgpp'):
                await setGroupPhoto(sock, chatId, senderId, message);
                break;
                
            case userMessage.startsWith('.instagram') || userMessage.startsWith('.insta') || userMessage === '.ig' || userMessage.startsWith('.ig '):
                await instagramCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.igsc'):
                await igsCommand(sock, chatId, message, true);
                break;
                
            case userMessage.startsWith('.igs'):
                await igsCommand(sock, chatId, message, false);
                break;
                
            case userMessage.startsWith('.fb') || userMessage.startsWith('.facebook'):
                await facebookCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.music'):
                await playCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.spotify'):
                await spotifyCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.play') || userMessage.startsWith('.mp3') || userMessage.startsWith('.ytmp3') || userMessage.startsWith('.song'):
                await songCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.video') || userMessage.startsWith('.ytmp4'):
                await videoCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.tiktok') || userMessage.startsWith('.tt'):
                await tiktokCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.gpt') || userMessage.startsWith('.gemini') || userMessage.startsWith('.ia'):
                await aiCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.translate') || userMessage.startsWith('.trt'):
                const commandLength = userMessage.startsWith('.translate') ? 10 : 4;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(commandLength));
                break;
                
            case userMessage.startsWith('.ss') || userMessage.startsWith('.ssweb') || userMessage.startsWith('.screenshot'):
                const ssCommandLength = userMessage.startsWith('.screenshot') ? 11 : (userMessage.startsWith('.ssweb') ? 6 : 3);
                await handleSsCommand(sock, chatId, message, userMessage.slice(ssCommandLength).trim());
                break;
                
            case userMessage.startsWith('.areact') || userMessage.startsWith('.autoreact') || userMessage.startsWith('.autoreaction'):
                const isOwnerOrSudoReact = message.key.fromMe || senderIsSudo;
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoReact);
                break;
                
            case userMessage.startsWith('.sudo'):
                await sudoCommand(sock, chatId, message);
                break;
                
            case userMessage === '.goodnight' || userMessage === '.lovenight' || userMessage === '.gn':
                await goodnightCommand(sock, chatId, message);
                break;
                
            case userMessage === '.shayari' || userMessage === '.shayri':
                await shayariCommand(sock, chatId, message);
                break;
                
            case userMessage === '.roseday':
                await rosedayCommand(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.imagine') || userMessage.startsWith('.flux') || userMessage.startsWith('.dalle'):
                await imagineCommand(sock, chatId, message);
                break;
                
            case userMessage === '.jid':
                {
                    const groupJid = message.key.remoteJid;
                    if (!groupJid.endsWith('@g.us')) {
                        await sock.sendMessage(chatId, { text: "❌ Este comando solo se puede usar en un grupo." });
                    } else {
                        await sock.sendMessage(chatId, { text: `✅ JID del Grupo: ${groupJid}` }, { quoted: message });
                    }
                }
                break;
                
            case userMessage.startsWith('.autotyping'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
                
            case userMessage.startsWith('.autoread'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
                
            case userMessage.startsWith('.heart'):
                await handleHeart(sock, chatId, message);
                break;
                
            case userMessage.startsWith('.horny') || userMessage.startsWith('.circle') || userMessage.startsWith('.lgbt') || userMessage.startsWith('.lolice') || userMessage.startsWith('.simpcard') || userMessage.startsWith('.tonikawa') || userMessage.startsWith('.its-so-stupid') || userMessage.startsWith('.namecard') || userMessage.startsWith('.oogway2') || userMessage.startsWith('.oogway') || userMessage.startsWith('.tweet') || userMessage.startsWith('.ytcomment') || userMessage.startsWith('.comrade') || userMessage.startsWith('.gay') || userMessage.startsWith('.glass') || userMessage.startsWith('.jail') || userMessage.startsWith('.passed') || userMessage.startsWith('.triggered'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = parts[0].slice(1);
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
                
            case userMessage.startsWith('.animu') || userMessage.startsWith('.nom') || userMessage.startsWith('.poke') || userMessage.startsWith('.cry') || userMessage.startsWith('.kiss') || userMessage.startsWith('.pat') || userMessage.startsWith('.hug') || userMessage.startsWith('.wink') || userMessage.startsWith('.facepalm') || userMessage.startsWith('.face-palm') || userMessage.startsWith('.animuquote') || userMessage.startsWith('.loli'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    let sub = parts[0].slice(1);
                    if (sub === 'facepalm') sub = 'face-palm';
                    if (sub === 'quote' || sub === 'animuquote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                }
                break;
                
            case userMessage === '.crop' || userMessage === '.stickercrop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
                
            case userMessage.startsWith('.pies'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await piesCommand(sock, chatId, message, args);
                    commandExecuted = true;
                }
                break;
                
            case userMessage === '.china' || userMessage === '.indonesia' || userMessage === '.japan' || userMessage === '.korea' || userMessage === '.hijab':
                {
                    const alias = userMessage.slice(1);
                    await piesAlias(sock, chatId, message, alias);
                    commandExecuted = true;
                }
                break;
                
            case userMessage.startsWith('.update'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                    await updateCommand(sock, chatId, message, senderIsSudo, zipArg);
                }
                commandExecuted = true;
                break;
                
            case userMessage.startsWith('.removebg') || userMessage.startsWith('.rmbg') || userMessage.startsWith('.nobg'):
                await removebgCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
                
            case userMessage.startsWith('.remini') || userMessage.startsWith('.enhance') || userMessage.startsWith('.upscale'):
                await reminiCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
                
            case userMessage.startsWith('.sora'):
                await soraCommand(sock, chatId, message);
                break;
                
            default:
                if (isGroup) {
                    if (userMessage) {
                        await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                    }
                    const { handleTagDetection } = require('./commands/antitag');
                    await handleTagDetection(sock, chatId, message, senderId);
                    await handleMentionDetection(sock, chatId, message);
                }
                commandExecuted = false;
                break;
        }

        if (commandExecuted !== false) {
            await showTypingAfterCommand(sock, chatId);
        }

        if (userMessage.startsWith('.')) {
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
        // Evitar enviar mensaje de error si el chatId no está definido (ej. en actualizaciones de estado)
        if (chatId) {
            await sock.sendMessage(chatId, {
                text: '❌ ¡Error al procesar el comando! Inténtalo de nuevo.'
            });
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        if (!id.endsWith('@g.us')) return;

        let isPublic = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) { }

        if (action === 'promote') {
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        if (action === 'demote') {
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
        }

        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};