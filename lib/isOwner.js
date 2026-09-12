/**
 * Java Bot MD - Verificador de Propietario o Sudo
 * Verifica de forma robusta y normalizada si un usuario es el dueño principal 
 * o un usuario con privilegios sudo.
 * 
 * @param {string} senderId - El JID del remitente (ej: 1234567890@s.whatsapp.net).
 * @returns {Promise<boolean>} True si es dueño o sudo, False en caso contrario.
 */
const settings = require('../settings');
const { isSudo } = require('./index');

async function isOwnerOrSudo(senderId) {
    try {
        // Validación inicial rápida
        if (!senderId) return false;

        // 1. Normalizar el número del propietario (eliminar espacios, '+', o caracteres no numéricos)
        const rawOwnerNumber = String(settings.ownerNumber || '');
        const cleanOwnerNumber = rawOwnerNumber.replace(/\D/g, '');
        
        if (!cleanOwnerNumber || cleanOwnerNumber.length < 10) {
            console.warn('⚠️ Advertencia: settings.ownerNumber no está configurado correctamente.');
            return false;
        }

        // 2. Construir el JID esperado del propietario
        const ownerJid = `${cleanOwnerNumber}@s.whatsapp.net`;

        // 3. Comparación directa (Baileys ya normaliza el senderId a este formato)
        if (senderId === ownerJid) {
            return true;
        }

        // 4. Verificación de fallback contra la base de datos de usuarios Sudo
        const sudoCheck = await isSudo(senderId);
        return Boolean(sudoCheck);

    } catch (error) {
        console.error('❌ Error en isOwnerOrSudo:', error.message);
        // Fallo seguro: denegar acceso en caso de error inesperado para proteger el bot
        return false;
    }
}

module.exports = isOwnerOrSudo;