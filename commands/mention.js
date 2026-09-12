const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const STATE_FILE = path.join(DATA_DIR, 'mention.json');

/**
 * Asegura que los directorios necesarios existan.
 */
function ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

/**
 * Carga el estado de la configuración de menciones de forma segura.
 */
function loadState() {
    try {
        ensureDirs();
        if (!fs.existsSync(STATE_FILE)) {
            const defaultState = { enabled: false, assetPath: '', type: 'text' };
            fs.writeFileSync(STATE_FILE, JSON.stringify(defaultState, null, 2), 'utf8');
            return defaultState;
        }
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const state = JSON.parse(raw);
        
        // Limpieza: si usa el asset por defecto antiguo, lo tratamos como sin asset personalizado
        if (state?.assetPath?.endsWith('mention_default.webp')) {
            return { enabled: !!state.enabled, assetPath: '', type: 'text' };
        }
        return state;
    } catch (e) {
        console.warn('⚠️ Error al cargar estado de mención:', e.message);
        return { enabled: false, assetPath: '', type: 'text' };
    }
}

/**
 * Guarda el estado de la configuración de menciones de forma segura.
 */
function saveState(state) {
    try {
        ensureDirs();
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
        console.error('❌ Error al guardar estado de mención:', e.message);
    }
}

/**
 * Detecta automáticamente cuando el bot es mencionado en un grupo y responde.
 */
async function handleMentionDetection(sock, chatId, message) {
    try {
        if (message.key?.fromMe) return;

        const state = loadState();
        if (!state.enabled) return;

        // Normalizar JID del bot
        const rawId = sock.user?.id || sock.user?.jid || '';
        if (!rawId) return;
        const botNum = rawId.split('@')[0].split(':')[0];
        const botJids = [
            `${botNum}@s.whatsapp.net`,
            `${botNum}@whatsapp.net`,
            rawId
        ];

        // Extraer contextInfo de múltiples tipos de mensajes
        const msg = message.message || {};
        const contexts = [
            msg.extendedTextMessage?.contextInfo,
            msg.imageMessage?.contextInfo,
            msg.videoMessage?.contextInfo,
            msg.documentMessage?.contextInfo,
            msg.stickerMessage?.contextInfo
        ].filter(Boolean);

        let mentioned = [];
        for (const c of contexts) {
            if (Array.isArray(c.mentionedJid)) {
                mentioned = mentioned.concat(c.mentionedJid);
            }
        }

        // Fallback heurístico: detectar si el texto incluye el número del bot como mención
        if (!mentioned.length) {
            const rawText = (
                msg.conversation ||
                msg.extendedTextMessage?.text ||
                msg.imageMessage?.caption ||
                msg.videoMessage?.caption ||
                ''
            ).toString();
            
            if (rawText) {
                const safeBot = botNum.replace(/[-\s]/g, '');
                const re = new RegExp(`@?${safeBot}\\b`, 'i');
                if (!re.test(rawText.replace(/\s+/g, ''))) return; // No hay mención
            } else {
                return;
            }
        }

        const isBotMentioned = mentioned.some(j => botJids.includes(j));
        if (!isBotMentioned && mentioned.length > 0) return; // Hay menciones, pero no al bot

        // Enviar respuesta personalizada o por defecto
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        if (!state.assetPath || !state.type) {
            // Respuesta por defecto elegante y útil
            const defaultMsg = `╭━━━⊱ 👋 *¡HOLA!* ⊱━━━╮
│
│  Me has mencionado. ¿En qué puedo 
│  ayudarte hoy? 
│
│  💡 Escribe *.help* o *.menu* para 
│  ver todos mis comandos disponibles.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
            
            await sock.sendMessage(chatId, {
                text: defaultMsg,
                footer: `🤖 ${botName} | Asistente Virtual`,
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
            return;
        }

        const assetPath = path.join(__dirname, '..', state.assetPath);
        if (!fs.existsSync(assetPath)) {
            // Fallback si el archivo fue borrado manualmente
            await sock.sendMessage(chatId, { text: '👋 ¡Hola! ¿En qué puedo ayudarte?' }, { quoted: message });
            return;
        }

        try {
            if (state.type === 'sticker') {
                await sock.sendMessage(chatId, { sticker: fs.readFileSync(assetPath) }, { quoted: message });
            } else {
                const payload = {};
                if (state.type === 'image') payload.image = { url: assetPath };
                else if (state.type === 'video') {
                    payload.video = { url: assetPath };
                    if (state.gifPlayback) payload.gifPlayback = true;
                } else if (state.type === 'audio') {
                    payload.audio = { url: assetPath };
                    payload.mimetype = state.mimetype || 'audio/mpeg';
                    payload.ptt = typeof state.ptt === 'boolean' ? state.ptt : false;
                } else if (state.type === 'text') {
                    payload.text = fs.readFileSync(assetPath, 'utf8');
                } else {
                    payload.text = '👋 ¡Hola! ¿En qué puedo ayudarte?';
                }
                
                // Si es texto, añadimos el diseño premium y botón
                if (state.type === 'text') {
                    payload.footer = `🤖 ${botName} | Asistente Virtual`;
                    payload.buttons = [{
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📢 Únete a mi Canal Oficial',
                            url: channelLink,
                            merchant_url: channelLink
                        })
                    }];
                    payload.headerType = 1;
                }
                
                await sock.sendMessage(chatId, payload, { quoted: message });
            }
        } catch (e) {
            console.error('❌ Error al enviar asset de mención:', e.message);
            await sock.sendMessage(chatId, { text: '👋 ¡Hola! ¿En qué puedo ayudarte?' }, { quoted: message });
        }
    } catch (err) {
        console.error('❌ Error en handleMentionDetection:', err);
    }
}

/**
 * Comando para activar o desactivar la respuesta a menciones (.mention)
 */
async function mentionToggleCommand(sock, chatId, message, args, isOwner) {
    try {
        if (!isOwner) {
            return await sock.sendMessage(chatId, { text: '❌ Este comando es exclusivo del *dueño o sudo* del bot.' }, { quoted: message });
        }

        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        const onoff = (args || '').trim().toLowerCase();

        if (!onoff || !['on', 'off', 'activar', 'desactivar'].includes(onoff)) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ *Uso incorrecto*\n\nPor favor, usa:\n• `.mention on` (Activar)\n• `.mention off` (Desactivar)' 
            }, { quoted: message });
        }

        const state = loadState();
        state.enabled = (onoff === 'on' || onoff === 'activar');
        saveState(state);

        const statusEmoji = state.enabled ? '✅' : '🔓';
        const statusText = state.enabled ? 'ACTIVADO' : 'DESACTIVADO';
        const statusDesc = state.enabled 
            ? 'El bot ahora responderá automáticamente cuando lo mencionen en el grupo.' 
            : 'El bot ya no responderá automáticamente a las menciones.';

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 🔔 *RESPUESTA A MENCIÓN* ⊱━━━╮
│
│  🤖 *Estado:* ${statusEmoji} *${statusText}*
│
│  📝 *Nota:* ${statusDesc}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Configuración`,
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

    } catch (error) {
        console.error('❌ Error en mentionToggleCommand:', error);
    }
}

/**
 * Comando para establecer un medio personalizado como respuesta a mención (.setmention)
 */
async function setMentionCommand(sock, chatId, message, isOwner) {
    try {
        if (!isOwner) {
            return await sock.sendMessage(chatId, { text: '❌ Este comando es exclusivo del *dueño o sudo* del bot.' }, { quoted: message });
        }

        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
        
        const ctx = message.message?.extendedTextMessage?.contextInfo;
        const qMsg = ctx?.quotedMessage;
        
        if (!qMsg) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ *Uso incorrecto*\n\nPor favor, *responde* a un mensaje (texto, sticker, imagen, video o audio) que quieras usar como respuesta, y luego escribe `.setmention`.' 
            }, { quoted: message });
        }

        let type = 'text', buf, dataType;
        if (qMsg.stickerMessage) { dataType = 'stickerMessage'; type = 'sticker'; }
        else if (qMsg.imageMessage) { dataType = 'imageMessage'; type = 'image'; }
        else if (qMsg.videoMessage) { dataType = 'videoMessage'; type = 'video'; }
        else if (qMsg.audioMessage) { dataType = 'audioMessage'; type = 'audio'; }
        else if (qMsg.documentMessage) { dataType = 'documentMessage'; type = 'file'; }
        else if (qMsg.conversation || qMsg.extendedTextMessage?.text) { type = 'text'; }
        else {
            return await sock.sendMessage(chatId, { text: '❌ Tipo de medio no soportado. Responde a texto, sticker, imagen, video o audio.' }, { quoted: message });
        }

        if (type === 'text') {
            buf = Buffer.from(qMsg.conversation || qMsg.extendedTextMessage?.text || '', 'utf8');
            if (!buf.length) return await sock.sendMessage(chatId, { text: '❌ El texto está vacío.' }, { quoted: message });
        } else {
            try {
                const media = qMsg[dataType];
                if (!media) throw new Error('No media');
                const kind = type === 'sticker' ? 'sticker' : type;
                const stream = await downloadContentFromMessage(media, kind);
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                buf = Buffer.concat(chunks);
            } catch (e) {
                console.error('❌ Error de descarga:', e.message);
                return await sock.sendMessage(chatId, { text: '❌ No se pudo descargar el medio. Inténtalo de nuevo.' }, { quoted: message });
            }
        }

        // Límite de 1MB para evitar sobrecarga
        if (buf.length > 1024 * 1024) {
            return await sock.sendMessage(chatId, { text: '❌ El archivo es demasiado grande. El límite máximo es *1 MB*.' }, { quoted: message });
        }

        let mimetype = qMsg[dataType]?.mimetype || '';
        let ptt = !!qMsg.audioMessage?.ptt;
        let gifPlayback = !!qMsg.videoMessage?.gifPlayback;
        let ext = 'bin';
        
        if (type === 'sticker') ext = 'webp';
        else if (type === 'image') ext = mimetype.includes('png') ? 'png' : 'jpg';
        else if (type === 'video') ext = 'mp4';
        else if (type === 'audio') {
            if (mimetype.includes('ogg') || mimetype.includes('opus')) { ext = 'ogg'; mimetype = 'audio/ogg; codecs=opus'; }
            else if (mimetype.includes('mpeg') || mimetype.includes('mp3')) { ext = 'mp3'; mimetype = 'audio/mpeg'; }
            else if (mimetype.includes('aac')) { ext = 'aac'; mimetype = 'audio/aac'; }
            else if (mimetype.includes('wav')) { ext = 'wav'; mimetype = 'audio/wav'; }
            else if (mimetype.includes('m4a') || mimetype.includes('mp4')) { ext = 'm4a'; mimetype = 'audio/mp4'; }
            else { ext = 'mp3'; mimetype = 'audio/mpeg'; }
        } else if (type === 'text') {
            ext = 'txt';
        }

        ensureDirs();
        
        // Limpiar assets personalizados anteriores para no acumular basura
        try {
            const files = fs.readdirSync(ASSETS_DIR);
            for (const f of files) {
                if (f.startsWith('mention_custom.')) {
                    try { fs.unlinkSync(path.join(ASSETS_DIR, f)); } catch {}
                }
            }
        } catch (e) {
            console.warn('⚠️ Limpieza de assets anteriores falló:', e.message);
        }

        const outName = `mention_custom.${ext}`;
        const outPath = path.join(ASSETS_DIR, outName);
        
        try { 
            fs.writeFileSync(outPath, buf); 
        } catch (e) {
            console.error('❌ Error al escribir archivo:', e.message);
            return await sock.sendMessage(chatId, { text: '❌ No se pudo guardar el archivo en el servidor.' }, { quoted: message });
        }

        const state = loadState();
        state.assetPath = path.join('assets', outName);
        state.type = type;
        if (type === 'audio') {
            state.mimetype = mimetype;
            state.ptt = ptt;
        }
        if (type === 'video') {
            state.gifPlayback = gifPlayback;
        }
        saveState(state);

        const typeNames = {
            'sticker': 'Sticker',
            'image': 'Imagen',
            'video': 'Video',
            'audio': 'Audio',
            'text': 'Texto'
        };

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ✅ *CONFIGURACIÓN EXITOSA* ⊱━━━╮
│
│  🎯 *Tipo de respuesta:* ${typeNames[type] || type}
│  💾 *Tamaño:* ${(buf.length / 1024).toFixed(2)} KB
│
│  📝 El bot ahora responderá a las 
│  menciones con este contenido.
│  (Recuerda activarlo con *.mention on*)
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Configuración`,
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

    } catch (error) {
        console.error('❌ Error en setMentionCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocurrió un error inesperado al configurar la mención.' }, { quoted: message });
    }
}

module.exports = { handleMentionDetection, mentionToggleCommand, setMentionCommand };