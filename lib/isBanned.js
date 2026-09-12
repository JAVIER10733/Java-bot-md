/**
 * Java Bot MD - Sistema de Gestión de Baneos
 * Gestiona la lista de usuarios baneados con caché en memoria para máximo rendimiento.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BANNED_FILE_PATH = path.join(DATA_DIR, 'banned.json');

/**
 * Caché en memoria para evitar lecturas de disco repetidas.
 * Se invalida automáticamente cuando se modifican los datos.
 */
let bannedCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5000; // La caché se refresca cada 5 segundos como máximo

/**
 * Asegura que el directorio de datos exista de forma segura.
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Carga la lista de usuarios baneados desde el archivo JSON.
 * Usa caché en memoria para evitar lecturas de disco innecesarias.
 * @returns {Array<string>} Lista de JIDs baneados.
 */
function loadBannedList() {
    const now = Date.now();
    
    // Si la caché es válida, retornarla inmediatamente
    if (bannedCache !== null && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return bannedCache;
    }

    try {
        ensureDataDir();
        
        if (!fs.existsSync(BANNED_FILE_PATH)) {
            fs.writeFileSync(BANNED_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
            bannedCache = [];
            cacheTimestamp = now;
            return bannedCache;
        }

        const rawData = fs.readFileSync(BANNED_FILE_PATH, 'utf8');
        const parsed = JSON.parse(rawData);
        
        // Validar que sea un array
        if (!Array.isArray(parsed)) {
            console.warn('️ banned.json no contiene un array. Reiniciando lista.');
            bannedCache = [];
            saveBannedList(bannedCache);
            return bannedCache;
        }
        
        bannedCache = parsed;
        cacheTimestamp = now;
        return bannedCache;
    } catch (error) {
        console.error('❌ Error al cargar banned.json:', error.message);
        // Fallback seguro: lista vacía
        bannedCache = [];
        cacheTimestamp = now;
        return bannedCache;
    }
}

/**
 * Guarda la lista de usuarios baneados en el archivo JSON e invalida la caché.
 * @param {Array<string>} list - Lista de JIDs baneados.
 * @returns {boolean} True si se guardó correctamente.
 */
function saveBannedList(list) {
    try {
        ensureDataDir();
        fs.writeFileSync(BANNED_FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
        bannedCache = list;
        cacheTimestamp = Date.now();
        return true;
    } catch (error) {
        console.error('❌ Error al guardar banned.json:', error.message);
        return false;
    }
}

/**
 * Verifica si un usuario está baneado.
 * @param {string} userId - El JID del usuario a verificar.
 * @returns {boolean} True si el usuario está baneado.
 */
function isBanned(userId) {
    try {
        if (!userId) return false;
        const bannedList = loadBannedList();
        return bannedList.includes(userId);
    } catch (error) {
        console.error('❌ Error al verificar estado de baneo:', error.message);
        return false; // Por seguridad, no bloquear si hay error
    }
}

/**
 * Añade un usuario a la lista de baneados.
 * @param {string} userId - El JID del usuario a banear.
 * @returns {boolean} True si se añadió correctamente.
 */
function banUser(userId) {
    try {
        if (!userId) return false;
        const bannedList = loadBannedList();
        
        if (bannedList.includes(userId)) {
            return true; // Ya estaba baneado
        }
        
        bannedList.push(userId);
        return saveBannedList(bannedList);
    } catch (error) {
        console.error('❌ Error al banear usuario:', error.message);
        return false;
    }
}

/**
 * Elimina un usuario de la lista de baneados (desbanea).
 * @param {string} userId - El JID del usuario a desbanear.
 * @returns {boolean} True si se eliminó correctamente.
 */
function unbanUser(userId) {
    try {
        if (!userId) return false;
        const bannedList = loadBannedList();
        const index = bannedList.indexOf(userId);
        
        if (index === -1) {
            return true; // No estaba en la lista
        }
        
        bannedList.splice(index, 1);
        return saveBannedList(bannedList);
    } catch (error) {
        console.error('❌ Error al desbanear usuario:', error.message);
        return false;
    }
}

/**
 * Obtiene la lista completa de usuarios baneados.
 * @returns {Array<string>} Copia de la lista de JIDs baneados.
 */
function getBannedList() {
    return [...loadBannedList()]; // Retornar copia para evitar mutaciones externas
}

/**
 * Fuerza la invalidación de la caché (útil después de ediciones manuales del archivo).
 */
function clearBannedCache() {
    bannedCache = null;
    cacheTimestamp = 0;
}

module.exports = {
    isBanned,
    banUser,
    unbanUser,
    getBannedList,
    clearBannedCache
};