/**
 * Java Bot MD - Utilidades del Módulo OSINT
 * ✅ VERSIÓN FINAL: Acceso automático para el dueño con múltiples métodos de verificación.
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const BOT_NAME = global.botname || 'Java Bot MD';
const CHANNEL_LINK = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
 const PREMIUM_FILE = path.join(__dirname, '../../data/premiumUsers.json');

/**
 * Obtiene el JID del dueño desde settings.js, normalizado.
 */
function getOwnerJid() {
    try {
        const settings = require('../../settings');
        const ownerNumber = String(settings.ownerNumber || '').replace(/\D/g, '');
        if (ownerNumber.length >= 10) {
            return `${ownerNumber}@s.whatsapp.net`;
        }
    } catch (e) {
        console.error('⚠️ No se pudo leer settings.js');
    }
    return null;
}

/**
 * Normaliza un JID para comparación segura.
 * Elimina sufijos de dispositivo (:0, :1, :2) y asegura el dominio.
 */
function normalizeJid(jid) {
    if (!jid) return '';
    const clean = jid.split(':')[0]; // Elimina :0, :1, :2
    return clean.includes('@') ? clean : `${clean}@s.whatsapp.net`;
}

async function ensurePremiumFile() {
    const dataDir = path.dirname(PREMIUM_FILE);
    if (!fsSync.existsSync(dataDir)) fsSync.mkdirSync(dataDir, { recursive: true });
    if (!fsSync.existsSync(PREMIUM_FILE)) {
        await fs.writeFile(PREMIUM_FILE, JSON.stringify([], null, 2), 'utf8');
    }
}

/**
 * Verifica si el usuario tiene acceso Premium.
 * MÉTODOS DE VERIFICACIÓN (en orden de prioridad):
 * 1. Si el mensaje viene del propio dispositivo (fromMe) → SIEMPRE es el dueño
 * 2. Si el JID coincide con ownerNumber de settings.js
 * 3. Si está en la lista de usuarios Sudo
 * 4. Si está en la lista de usuarios Premium
 */
async function isPremiumUser(userId, isFromMe = false) {
    try {
        const normalizedUser = normalizeJid(userId);

        // MÉTODO 1: El más confiable - si el mensaje viene del propio dispositivo
        if (isFromMe) {
            console.log('✅ Acceso Premium concedido (fromMe = true)');
            return true;
        }

        // MÉTODO 2: Comparación con ownerNumber de settings.js
        const ownerJid = getOwnerJid();
        if (ownerJid && normalizeJid(ownerJid) === normalizedUser) {
            console.log(`✅ Acceso Premium concedido (owner JID match: ${normalizedUser})`);
            return true;
        }

        // MÉTODO 3: Verificar si es Sudo
        try {
            const { isSudo } = require('../../lib/index');
            if (await isSudo(normalizedUser)) {
                console.log(`✅ Acceso Premium concedido (usuario Sudo: ${normalizedUser})`);
                return true;
            }
        } catch (e) {
            // Si falla isSudo, continuamos
        }

        // MÉTODO 4: Verificar lista de usuarios Premium
        await ensurePremiumFile();
        const data = await fs.readFile(PREMIUM_FILE, 'utf8');
        const premiumList = JSON.parse(data);
        
        const isPremium = premiumList.some(jid => normalizeJid(jid) === normalizedUser);
        if (isPremium) {
            console.log(`✅ Acceso Premium concedido (lista premium: ${normalizedUser})`);
        } else {
            console.log(`❌ Acceso Premium denegado para: ${normalizedUser}`);
        }
        
        return isPremium;
    } catch (error) {
        console.error('❌ Error al verificar estado premium:', error.message);
        return false;
    }
}

/**
 * Envía el mensaje de bloqueo con diseño Premium.
 */
async function sendPremiumLockedMessage(sock, chatId, message) {
    return sock.sendMessage(chatId, {
        text: `━━━⊱ 🔒 *ACCESO DENEGADO* ⊱━━━╮
│
│  Este comando es parte del paquete 
│  *OSINT PREMIUM* de ${BOT_NAME}.
│
│  💎 *Beneficios del Plan Premium:*
│  • Búsqueda de información por teléfono
│  • Rastreo geográfico de direcciones IP
│  • Búsqueda de usuarios en redes sociales
│  • Verificación de correos electrónicos
│
│   *Para adquirir tu licencia:*
│  Contacta al propietario del bot o 
│  revisa la información en nuestro canal.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
        footer: `${BOT_NAME} · OSINT Premium`,
        buttons: [{
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: '📢 Info de Precios en el Canal',
                url: CHANNEL_LINK,
                merchant_url: CHANNEL_LINK
            })
        }],
        headerType: 1
    }, { quoted: message });
}

module.exports = { isPremiumUser, sendPremiumLockedMessage };