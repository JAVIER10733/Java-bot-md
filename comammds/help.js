const settings = require('../settings');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

/**
 * Catálogo de comandos organizado por categoría.
 */
const COMMAND_CATEGORIES = [
    {
        emoji: '🌐',
        title: 'General',
        alias: 'general',
        commands: ['`.help`', '`.ping`', '`.alive`', '`.tts <texto>`', '`.owner`', '`.joke`', '`.quote`', '`.fact`', '`.weather <ciudad>`', '`.news`', '`.attp <texto>`', '`.lyrics <canción>`', '`.8ball <pregunta>`', '`.groupinfo`', '`.staff`', '`.vv`', '`.trt <texto> <idioma>`', '`.ss <link>`', '`.jid`', '`.url`']
    },
    {
        emoji: '👮',
        title: 'Administración',
        alias: 'admin',
        commands: ['`.ban @user`', '`.promote @user`', '`.demote @user`', '`.mute <min>`', '`.unmute`', '`.delete`', '`.kick @user`', '`.warnings @user`', '`.warn @user`', '`.antilink`', '`.antibadword`', '`.clear`', '`.tag <mensaje>`', '`.tagall`', '`.tagnotadmin`', '`.hidetag`', '`.chatbot`', '`.resetlink`', '`.antitag`', '`.welcome`', '`.goodbye`', '`.setgdesc`', '`.setgname`', '`.setgpp`']
    },
    {
        emoji: '🔒',
        title: 'Propietario',
        alias: 'owner',
        commands: ['`.mode`', '`.clearsession`', '`.antidelete`', '`.cleartmp`', '`.update`', '`.settings`', '`.setpp`', '`.autoreact`', '`.autostatus`', '`.autotyping`', '`.autoread`', '`.anticall`', '`.pmblocker`', '`.setmention`', '`.mention`', '`.premium`']
    },
    {
        emoji: '🎨',
        title: 'Imagen y Stickers',
        alias: 'sticker',
        commands: ['`.blur`', '`.simage`', '`.sticker`', '`.removebg`', '`.remini`', '`.crop`', '`.tgsticker`', '`.meme`', '`.take`', '`.emojimix`', '`.igs`', '`.igsc`']
    },
    {
        emoji: '🎮',
        title: 'Juegos',
        alias: 'juegos',
        commands: ['`.tictactoe @user`', '`.hangman`', '`.guess <letra>`', '`.trivia`', '`.answer`', '`.truth`', '`.dare`']
    },
    {
        emoji: '🤖',
        title: 'Inteligencia Artificial',
        alias: 'ia',
        commands: ['`.gpt <pregunta>`', '`.gemini <pregunta>`', '`.imagine <prompt>`', '`.flux <prompt>`', '`.sora <prompt>`']
    },
    {
        emoji: '🎯',
        title: 'Diversión',
        alias: 'diversion',
        commands: ['`.compliment`', '`.insult`', '`.flirt`', '`.shayari`', '`.goodnight`', '`.roseday`', '`.character`', '`.wasted`', '`.ship`', '`.simp`', '`.stupid`']
    },
    {
        emoji: '🔤',
        title: 'Textmaker',
        alias: 'textmaker',
        commands: ['.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil', '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink', '.glitch', '.fire'].map((cmd) => `\`${cmd} <texto>\``)
    },
    {
        emoji: '📥',
        title: 'Descargas',
        alias: 'descargas',
        commands: ['`.play <canción>`', '`.song <canción>`', '`.spotify <búsqueda>`', '`.instagram <link>`', '`.facebook <link>`', '`.tiktok <link>`', '`.video <nombre>`', '`.ytmp4 <link>`']
    },
    {
        emoji: '🌸',
        title: 'Anime',
        alias: 'anime',
        commands: ['`.nom`', '`.poke`', '`.cry`', '`.kiss`', '`.pat`', '`.hug`', '`.wink`', '`.facepalm`']
    },
    {
        emoji: '💎',
        title: 'OSINT & Inteligencia (PREMIUM)',
        alias: 'osint',
        isPremium: true,
        commands: [
            '`.phoneinfo <número>`',
            '`.iplookup <dirección IP>`',
            '`.username <usuario>`',
            '`.emailtrace <correo>`',
            '`.darkweb_monitor`'
        ]
    }
];

// Caché en memoria para la imagen del menú (Evita leer el disco en cada comando)
let cachedMenuImage = null;

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
 * Construye una sección de categoría con formato limpio, simétrico y premium.
 */
function buildSection(category) {
    const commandsText = category.commands
        .map((cmd) => `  ▸  ${cmd}`)
        .join('\n');

    if (category.isPremium) {
        return `╭━━━⊱ 💎 *${category.title.toUpperCase()}* ⊱━━━╮
│
│  🔒 *Acceso Exclusivo / De Pago*
│  🚀 Disponible solo para usuarios 
│     con suscripción activa.
│
│  📋 *Herramientas incluidas:*
${commandsText}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
    }

    return `╭━━━⊱ ${category.emoji} *${category.title.toUpperCase()}* ⊱━━━╮
│
${commandsText}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
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
 * Construye el mensaje completo del menú de ayuda con diseño de tarjeta premium.
 */
function buildHelpMessage(filter) {
    const categories = resolveCategories(filter);
    
    // Contamos solo comandos reales (excluyendo la sección premium del total gratuito)
    const totalCommands = categories
        .filter(cat => !cat.isPremium)
        .reduce((sum, cat) => sum + cat.commands.length, 0);
    
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
        month: 'long',
        year: 'numeric'
    });
    
    const greeting = getGreeting();
    
    const categoryList = COMMAND_CATEGORIES
        .filter(cat => !cat.isPremium)
        .map((cat) => `  ▸  *${cat.alias}* ${cat.emoji}`)
        .join('\n');

    const header = `╭━━━⊱ 🤖 *${botName.toUpperCase()}* ⊱━━━╮
│
│  ${greeting.emoji}  *${greeting.text}, usuario!*
│
│  👑  *Creador:* ${owner}
│  🔖  *Versión:* ${version}
│  📅  *Fecha:* ${dateStr}
│  ⏰  *Hora:* ${timeStr} (EC)
│  📊  *Comandos:* ${totalCommands} activos
│  🟢  *Estado:* En línea y operativo
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    const sections = categories.map(buildSection).join('\n');

    const footer = `╭━━━⊱ 💡 *CÓMO USAR EL MENÚ* ⊱━━━╮
│
│  1. Escribe un comando con el prefijo "."
│  2. Filtra por categoría: *.help <categoría>*
│     *(Ejemplo: .help ia  o  .help admin)*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━⊱ 📂 *CATEGORÍAS RÁPIDAS* ⊱━━━╮
│
${categoryList}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    return `${header}\n\n${sections}\n\n${footer}`;
}

/**
 * Envía el menú de ayuda con imagen (en caché), botón del canal y manejo de errores robusto.
 */
async function helpCommand(sock, chatId, message, fourthParam = []) {
    try {
        const args = Array.isArray(fourthParam) ? fourthParam : [];
        const filter = args[0];
        const helpMessage = buildHelpMessage(filter);

        const botName = global.botname || settings.botName || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        // Reacción inicial
        await sock.sendMessage(chatId, { react: { text: '📜', key: message.key } });

        // Cargar imagen en caché si no existe
        if (!cachedMenuImage && fsSync.existsSync(imagePath)) {
            cachedMenuImage = await fs.readFile(imagePath);
        }

        const messageOptions = {
            caption: helpMessage,
            footer: `${botName} · Menú de comandos profesional`,
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

        // Envío con imagen en caché (ultra rápido) o fallback a texto
        if (cachedMenuImage) {
            await sock.sendMessage(chatId, {
                image: cachedMenuImage,
                ...messageOptions
            }, { quoted: message });
        } else {
            console.warn('⚠️ Imagen del menú no encontrada. Se envía solo texto.');
            await sock.sendMessage(chatId, {
                text: helpMessage,
                ...messageOptions
            }, { quoted: message });
        }

        // Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en helpCommand:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: '❌ Ocurrió un error al generar el menú. Inténtalo de nuevo en unos segundos.'
        }, { quoted: message });
    }
}

module.exports = helpCommand;