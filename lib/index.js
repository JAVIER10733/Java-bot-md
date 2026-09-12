/**
 * Java Bot MD - Central Database Helper
 * Gestiona la persistencia de configuraciones de grupos y usuarios en JSON.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE_PATH = path.join(DATA_DIR, 'userGroupData.json');

/**
 * Asegura que el directorio de datos exista de forma segura.
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Carga los datos del archivo JSON de forma segura, previniendo crasheos.
 * @returns {Object} Los datos cargados o un objeto vacío por defecto.
 */
function loadUserGroupData() {
    try {
        ensureDataDir();
        if (!fs.existsSync(DATA_FILE_PATH)) {
            const defaultData = {
                antibadword: {},
                antilink: {},
                antitag: {},
                welcome: {},
                goodbye: {},
                chatbot: {},
                warnings: {},
                sudo: []
            };
            fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
            return defaultData;
        }
        const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        const parsed = JSON.parse(rawData);
        return parsed || {};
    } catch (error) {
        console.error('❌ Error al cargar userGroupData.json:', error.message);
        // Fallback seguro para evitar que el bot deje de funcionar
        return {
            antibadword: {},
            antilink: {},
            antitag: {},
            welcome: {},
            goodbye: {},
            chatbot: {},
            warnings: {},
            sudo: []
        };
    }
}

/**
 * Guarda los datos en el archivo JSON de forma segura.
 * @param {Object} data - Los datos a guardar.
 * @returns {boolean} True si se guardó correctamente, False en caso de error.
 */
function saveUserGroupData(data) {
    try {
        ensureDataDir();
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('❌ Error al guardar userGroupData.json:', error.message);
        return false;
    }
}

// ==========================================
// 🛡️ SISTEMA ANTI-LINK
// ==========================================
async function setAntilink(groupId, type, action = 'delete') {
    const data = loadUserGroupData();
    if (!data.antilink) data.antilink = {};
    data.antilink[groupId] = { enabled: type === 'on', action };
    return saveUserGroupData(data);
}

async function getAntilink(groupId, type = null) {
    const data = loadUserGroupData();
    const config = data.antilink?.[groupId];
    if (!config) return null;
    if (type === 'on' && !config.enabled) return null;
    return config;
}

async function removeAntilink(groupId) {
    const data = loadUserGroupData();
    if (data.antilink?.[groupId]) {
        delete data.antilink[groupId];
        return saveUserGroupData(data);
    }
    return true;
}

// ==========================================
// 🏷️ SISTEMA ANTI-TAG
// ==========================================
async function setAntitag(groupId, type, action = 'delete') {
    const data = loadUserGroupData();
    if (!data.antitag) data.antitag = {};
    data.antitag[groupId] = { enabled: type === 'on', action };
    return saveUserGroupData(data);
}

async function getAntitag(groupId, type = null) {
    const data = loadUserGroupData();
    const config = data.antitag?.[groupId];
    if (!config) return null;
    if (type === 'on' && !config.enabled) return null;
    return config;
}

async function removeAntitag(groupId) {
    const data = loadUserGroupData();
    if (data.antitag?.[groupId]) {
        delete data.antitag[groupId];
        return saveUserGroupData(data);
    }
    return true;
}

// ==========================================
// ⚠️ SISTEMA DE ADVERTENCIAS (WARNINGS)
// ==========================================
async function incrementWarningCount(groupId, userId) {
    const data = loadUserGroupData();
    if (!data.warnings) data.warnings = {};
    if (!data.warnings[groupId]) data.warnings[groupId] = {};
    if (!data.warnings[groupId][userId]) data.warnings[groupId][userId] = 0;
    
    data.warnings[groupId][userId]++;
    saveUserGroupData(data);
    return data.warnings[groupId][userId];
}

async function resetWarningCount(groupId, userId) {
    const data = loadUserGroupData();
    if (data.warnings?.[groupId]?.[userId] !== undefined) {
        data.warnings[groupId][userId] = 0;
        saveUserGroupData(data);
    }
    return true;
}

// ==========================================
// 👑 SISTEMA SUDO
// ==========================================
async function isSudo(userId) {
    const data = loadUserGroupData();
    return Array.isArray(data.sudo) && data.sudo.includes(userId);
}

async function addSudo(userJid) {
    const data = loadUserGroupData();
    if (!Array.isArray(data.sudo)) data.sudo = [];
    if (!data.sudo.includes(userJid)) {
        data.sudo.push(userJid);
        return saveUserGroupData(data);
    }
    return true;
}

async function removeSudo(userJid) {
    const data = loadUserGroupData();
    if (Array.isArray(data.sudo)) {
        const idx = data.sudo.indexOf(userJid);
        if (idx !== -1) {
            data.sudo.splice(idx, 1);
            return saveUserGroupData(data);
        }
    }
    return true;
}

async function getSudoList() {
    const data = loadUserGroupData();
    return Array.isArray(data.sudo) ? data.sudo : [];
}

// ==========================================
// 👋 SISTEMA DE BIENVENIDA
// ==========================================
async function addWelcome(jid, enabled, message) {
    const data = loadUserGroupData();
    if (!data.welcome) data.welcome = {};
    data.welcome[jid] = {
        enabled,
        message: message || '╭━━━⊱ 👋 *¡BIENVENIDO/A!* ⊱━━━╮\n│\n│  🎉 Hola *{user}*, nos alegra que te\n│  unas a nuestra comunidad.\n│\n│  👥 *Grupo:* {group}\n│  📜 *Normas:* _{description}_\n│\n│  ¡Disfruta tu estancia!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯'
    };
    return saveUserGroupData(data);
}

async function delWelcome(jid) {
    const data = loadUserGroupData();
    if (data.welcome?.[jid]) {
        delete data.welcome[jid];
        return saveUserGroupData(data);
    }
    return true;
}

async function isWelcomeOn(jid) {
    const data = loadUserGroupData();
    return Boolean(data.welcome?.[jid]?.enabled);
}

async function getWelcome(jid) {
    const data = loadUserGroupData();
    return data.welcome?.[jid]?.message || null;
}

// ==========================================
// 👋 SISTEMA DE DESPEDIDA
// ==========================================
async function addGoodbye(jid, enabled, message) {
    const data = loadUserGroupData();
    if (!data.goodbye) data.goodbye = {};
    data.goodbye[jid] = {
        enabled,
        message: message || '╭━━━⊱ 👋 *HASTA PRONTO* ⊱━━━╮\n│\n│  😢 *{user}* ha abandonado el grupo.\n│\n│  🏰 *Grupo:* {group}\n│\n│  ¡Gracias por haber sido parte de\n│  nuestra comunidad!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯'
    };
    return saveUserGroupData(data);
}

async function delGoodBye(jid) {
    const data = loadUserGroupData();
    if (data.goodbye?.[jid]) {
        delete data.goodbye[jid];
        return saveUserGroupData(data);
    }
    return true;
}

async function isGoodByeOn(jid) {
    const data = loadUserGroupData();
    return Boolean(data.goodbye?.[jid]?.enabled);
}

async function getGoodbye(jid) {
    const data = loadUserGroupData();
    return data.goodbye?.[jid]?.message || null;
}

// ==========================================
// 🛡️ SISTEMA ANTI-BADWORD
// ==========================================
async function setAntiBadword(groupId, type, action = 'delete') {
    const data = loadUserGroupData();
    if (!data.antibadword) data.antibadword = {};
    data.antibadword[groupId] = { enabled: type === 'on', action };
    return saveUserGroupData(data);
}

async function getAntiBadword(groupId, type = null) {
    const data = loadUserGroupData();
    const config = data.antibadword?.[groupId];
    if (!config) return null;
    if (type === 'on' && !config.enabled) return null;
    return config;
}

async function removeAntiBadword(groupId) {
    const data = loadUserGroupData();
    if (data.antibadword?.[groupId]) {
        delete data.antibadword[groupId];
        return saveUserGroupData(data);
    }
    return true;
}

// ==========================================
// 🤖 SISTEMA CHATBOT
// ==========================================
async function setChatbot(groupId, enabled) {
    const data = loadUserGroupData();
    if (!data.chatbot) data.chatbot = {};
    data.chatbot[groupId] = { enabled };
    return saveUserGroupData(data);
}

async function getChatbot(groupId) {
    const data = loadUserGroupData();
    return data.chatbot?.[groupId] || null;
}

async function removeChatbot(groupId) {
    const data = loadUserGroupData();
    if (data.chatbot?.[groupId]) {
        delete data.chatbot[groupId];
        return saveUserGroupData(data);
    }
    return true;
}

module.exports = {
    setAntilink,
    getAntilink,
    removeAntilink,
    setAntitag,
    getAntitag,
    removeAntitag,
    incrementWarningCount,
    resetWarningCount,
    isSudo,
    addSudo,
    removeSudo,
    getSudoList,
    addWelcome,
    delWelcome,
    isWelcomeOn,
    getWelcome,
    addGoodbye,
    delGoodBye,
    isGoodByeOn,
    getGoodbye,
    setAntiBadword,
    getAntiBadword,
    removeAntiBadword,
    setChatbot,
    getChatbot,
    removeChatbot,
};