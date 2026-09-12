const settings = require('../settings');
const fs = require('fs');
const path = require('path');

/**
 * Catálogo de comandos organizado por categoría.
 * Para agregar un comando nuevo, añade una línea en el arreglo correspondiente.
 */
const COMMAND_CATEGORIES = [
    {
        emoji: '🌐',
        title: 'General',
        alias: 'general',
        commands: [
            '.help / .menu', '.ping', '.alive', '.tts <texto>', '.owner',
            '.joke', '.quote', '.fact', '.weather <ciudad>', '.news',
            '.attp <texto>', '.lyrics <canción>', '.8ball <pregunta>',
            '.groupinfo', '.staff / .admins', '.vv', '.trt <texto> <idioma>',
            '.ss <link>', '.jid', '.url'
        ]
    },
    {
        emoji: '👮',
        title: 'Administración',
        alias: 'admin',
        commands: [
            '.ban @user', '.promote @user', '.demote @user', '.mute <min>',
            '.unmute', '.delete / .del', '.kick @user', '.warnings @user',
            '.warn @user', '.antilink', '.antibadword', '.clear',
            '.tag <mensaje>', '.tagall', '.tagnotadmin', '.hidetag <mensaje>',
            '.chatbot', '.resetlink', '.antitag <on/off>', '.welcome <on/off>',
            '.goodbye <on/off>', '.setgdesc <descripción>', '.setgname <nombre>',
            '.setgpp (responde a una imagen)'
        ]
    },
    {
        emoji: '🔒',
        title: 'Propietario',
        alias: 'owner',
        commands: [
            '.mode <public/private>', '.clearsession', '.antidelete', '.cleartmp',
            '.update', '.settings', '.setpp (responde a imagen)', '.autoreact <on/off>',
            '.autostatus <on/off>', '.autostatus react <on/off>', '.autotyping <on/off>',
            '.autoread <on/off>', '.anticall <on/off>', '.pmblocker <on/off/status>',
            '.pmblocker setmsg <texto>', '.setmention (responde a mensaje)', '.mention <on/off>'
        ]
    },
    {
        emoji: '🎨',
        title: 'Imagen y Stickers',
        alias: 'sticker',
        commands: [
            '.blur <imagen>', '.simage (responde a sticker)', '.sticker (responde a imagen)',
            '.removebg', '.remini', '.crop (responde a imagen)', '.tgsticker <link>',
            '.meme', '.take <packname>', '.emojimix <emj1>+<emj2>',
            '.igs <link instagram>', '.igsc <link instagram>'
        ]
    },
    {
        emoji: '🖼️',
        title: 'Pies',
        alias: 'pies',
        commands: ['.pies <país>', '.china', '.indonesia', '.japan', '.korea', '.hijab']
    },
    {
        emoji: '🎮',
        title: 'Juegos',
        alias: 'juegos',
        commands: ['.tictactoe @user', '.hangman', '.guess <letra>', '.trivia', '.answer <respuesta>', '.truth', '.dare']
    },
    {
        emoji: '🤖',
        title: 'Inteligencia Artificial',
        alias: 'ia',
        commands: ['.gpt <pregunta>', '.gemini <pregunta>', '.imagine <prompt>', '.flux <prompt>', '.sora <prompt>']
    },
    {
        emoji: '🎯',
        title: 'Diversión',
        alias: 'diversion',
        commands: [
            '.compliment @user', '.insult @user', '.flirt', '.shayari', '.goodnight',
            '.roseday', '.character @user', '.wasted @user', '.ship @user',
            '.simp @user', '.stupid @user [texto]'
        ]
    },
    {
        emoji: '🔤',
        title: 'Textmaker',
        alias: 'textmaker',
        commands: [
            '.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon',
            '.devil', '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker',
            '.sand', '.blackpink', '.glitch', '.fire'
        ].map((cmd) => `${cmd} <texto>`)
    },
    {
        emoji: '📥',
        title: 'Descargas',
        alias: 'descargas',
        commands: [
            '.play <canción>', '.song <canción>', '.spotify <búsqueda>',
            '.instagram <link>', '.facebook <link>', '.tiktok <link>',
            '.video <nombre>', '.ytmp4 <link>'
        ]
    },
    {
        emoji: '🌸',
        title: 'Anime',
        alias: 'anime',
        commands: ['.nom', '.poke', '.cry', '.kiss', '.pat', '.hug', '.wink', '.facepalm']
    }
];

const DIVIDER = '┈'.repeat(34);

/**
 * Devuelve un saludo según la hora del servidor (zona horaria de Ecuador).
 */
function getGreeting() {
    const hour = new Date().toLocaleString('en-US', {
        timeZone: 'America/Guayaquil',
        hour: 'numeric',
        hour12: false
    });
    const h = parseInt(hour, 10);

    if (h < 6) return { text: 'Buenas noches', emoji: '🌙' };
    if (h < 12) return { text: 'Buenos días', emoji: '☀️' };
    if (h < 19) return { text: 'Buenas tardes', emoji: '🌤️' };
    return { text: 'Buenas noches', emoji: '🌙' };
}

/**
 * Construye una sección de categoría con formato limpio y consistente.
 * El ancho fijo evita desalineación en iOS y Android.
 */
function buildSection(category) {
    const commandsText = category.commands
        .map((cmd) => `   •  ${cmd}`)
        .join('\n');

    return `┌─「 ${category.emoji}  *${category.title.toUpperCase()}* 」\n${commandsText}\n└${DIVIDER}`;
}

/**
 * Filtra las categorías según un alias recibido en el comando.
 */
function resolveCategories(filter) {
    if (!filter) return COMMAND_CATEGORIES;
    const normalized = filter.trim().toLowerCase();
    const match = COMMAND_CATEGORIES.filter((cat) => cat.alias === normalized);
    return match.length > 0 ? match : COMMAND_CATEGORIES;
}

/**
 * Construye el mensaje completo del menú de ayuda.
 */
function buildHelpMessage(filter) {
    const categories = resolveCategories(filter);
    const totalCommands = categories.reduce((sum, cat) => sum + cat.commands.length, 0);
    const isFiltered = categories.length < COMMAND_CATEGORIES.length;

    const botName = global.botname || settings.botName || 'Java Bot MD';
    const version = settings.version || '4.0.0';
    const owner = settings.botOwner || 'Professor';
    const timeStr = new Date().toLocaleString('es-EC', {
        timeZone: 'America/Guayaquil',
        hour: '2-digit',
        minute: '2-digit'
    });
    const dateStr = new Date().toLocaleDateString('es-EC', {
        timeZone: 'America/Guayaquil',
        day: '2-digit',
        month: 'long'
    });
    const greeting = getGreeting();
    const categoryList = COMMAND_CATEGORIES
        .map((cat) => `   •  *${cat.alias}* ${cat.emoji}`)
        .join('\n');

    const header = `┏━━━━━━━━━━━━━━━━━━━━┓
   ${greeting.emoji}  ${greeting.text}, bienvenido
┗━━━━━━━━━━━━━━━━━━━━┛

*${botName}*
${DIVIDER}
👑  Creador       : ${owner}
🔖  Versión       : ${version}
📅  Fecha         : ${dateStr}
⏰  Hora          : ${timeStr}
📊  Comandos      : ${totalCommands}${isFiltered ? ' (categoría filtrada)' : ''}
${DIVIDER}`;

    const sections = categories.map(buildSection).join('\n\n');

    const footer = `┌─「 💡  *CÓMO USAR EL MENÚ* 」
   •  Escribe un comando con el prefijo "."
   •  Filtra por categoría: *.help <categoría>*
└${DIVIDER}

┌─「 📂  *CATEGORÍAS DISPONIBLES* 」
${categoryList}
└${DIVIDER}`;

    return `${header}\n\n${sections}\n\n${footer}`;
}

/**
 * Envía el menú de ayuda con imagen, botón del canal y manejo de errores robusto.
 */
async function helpCommand(sock, chatId, message, fourthParam = []) {
    try {
        const args = Array.isArray(fourthParam) ? fourthParam : [];
        const filter = args[0];
        const helpMessage = buildHelpMessage(filter);

        const botName = global.botname || settings.botName || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        await sock.sendMessage(chatId, { react: { text: '📜', key: message.key } });

        const messageOptions = {
            caption: helpMessage,
            footer: `${botName} · Menú de comandos`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        };

        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                ...messageOptions
            }, { quoted: message });
        } else {
            console.warn('⚠️ Imagen del menú no encontrada. Se envía solo texto.');
            await sock.sendMessage(chatId, {
                text: helpMessage,
                ...messageOptions
            }, { quoted: message });
        }

    } catch (error) {
        console.error('❌ Error en helpCommand:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error al generar el menú. Inténtalo de nuevo en unos segundos.'
        }, { quoted: message });
    }
}

module.exports = helpCommand;