const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ANTILINK_FILE_PATH = path.join(DATA_DIR, 'antilinkSettings.json');

/**
 * Asegura que el directorio de datos exista de forma segura.
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Carga la configuración de antilink de forma segura, previniendo crasheos.
 */
function loadAntilinkSettings() {
    try {
        ensureDataDir();
        if (!fs.existsSync(ANTILINK_FILE_PATH)) {
            fs.writeFileSync(ANTILINK_FILE_PATH, JSON.stringify({}), 'utf8');
            return {};
        }
        const data = fs.readFileSync(ANTILINK_FILE_PATH, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('❌ Error al cargar antilinkSettings.json:', error.message);
        return {}; // Fallback seguro para evitar que el bot deje de funcionar
    }
}

/**
 * Guarda la configuración de antilink de forma segura.
 */
function saveAntilinkSettings(settings) {
    try {
        ensureDataDir();
        fs.writeFileSync(ANTILINK_FILE_PATH, JSON.stringify(settings, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Error al guardar antilinkSettings.json:', error.message);
    }
}

/**
 * Establece la configuración de antilink para un grupo.
 * @param {string} groupId - El ID del grupo.
 * @param {string} status - 'on' o 'off'.
 * @param {string} action - 'delete', 'warn', o 'kick'.
 */
function setAntilink(groupId, status, action = 'delete') {
    const settings = loadAntilinkSettings();
    settings[groupId] = {
        enabled: status === 'on',
        action: action
    };
    saveAntilinkSettings(settings);
}

/**
 * Obtiene la configuración de antilink de un grupo.
 * @param {string} groupId - El ID del grupo.
 * @param {string} [statusFilter] - Opcional: 'on' para filtrar solo si está activo.
 * @returns {object|null} - La configuración o null si no existe o no coincide.
 */
function getAntilink(groupId, statusFilter = null) {
    const settings = loadAntilinkSettings();
    const config = settings[groupId];
    
    if (!config) return null;
    
    // Si se solicita filtrar por estado 'on' y no está activo, retornar null
    if (statusFilter === 'on' && !config.enabled) {
        return null;
    }
    
    return config;
}

/**
 * Elimina la configuración de antilink de un grupo (lo desactiva completamente).
 * @param {string} groupId - El ID del grupo.
 */
function removeAntilink(groupId) {
    const settings = loadAntilinkSettings();
    if (settings[groupId]) {
        delete settings[groupId];
        saveAntilinkSettings(settings);
    }
}

module.exports = {
    setAntilink,
    getAntilink,
    removeAntilink
};