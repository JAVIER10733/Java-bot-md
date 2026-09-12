/**
 * Java Bot MD - Verificador de Administradores
 * Verifica de forma robusta y eficiente si el bot y el remitente son administradores del grupo.
 * 
 * @param {object} sock - La instancia del socket de Baileys.
 * @param {string} chatId - El ID del chat (ej: 123456789@g.us).
 * @param {string} senderId - El ID del remitente (ej: 123456789@s.whatsapp.net).
 * @param {object} [message] - (Opcional) El objeto del mensaje, para compatibilidad con firmas de funciones existentes.
 * @returns {Promise<{isSenderAdmin: boolean, isBotAdmin: boolean}>}
 */
async function isAdmin(sock, chatId, senderId, message = null) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants || [];

        /**
         * Normaliza un JID para garantizar una comparación consistente.
         * Elimina identificadores de dispositivo (ej: ':0', ':1') y asegura el dominio '@s.whatsapp.net'.
         */
        const normalizeJid = (jid) => {
            if (!jid) return '';
            const base = jid.split(':')[0]; // Elimina ':0' o ':1' si existe
            return base.includes('@') ? base : `${base}@s.whatsapp.net`;
        };

        const normalizedBotId = normalizeJid(sock.user.id);
        const normalizedSenderId = normalizeJid(senderId);

        let isBotAdmin = false;
        let isSenderAdmin = false;

        // Recorremos los participantes una sola vez para máxima eficiencia
        for (const p of participants) {
            const pNormalizedId = normalizeJid(p.id);
            
            // Verificar si el bot es admin
            if (pNormalizedId === normalizedBotId && (p.admin === 'admin' || p.admin === 'superadmin')) {
                isBotAdmin = true;
            }
            
            // Verificar si el remitente es admin
            if (pNormalizedId === normalizedSenderId && (p.admin === 'admin' || p.admin === 'superadmin')) {
                isSenderAdmin = true;
            }
            
            // 🚀 Optimización: Salir del bucle inmediatamente si ya confirmamos ambos roles
            if (isBotAdmin && isSenderAdmin) {
                break;
            }
        }

        return { isSenderAdmin, isBotAdmin };
    } catch (err) {
        console.error('❌ Error en isAdmin:', err.message);
        // En caso de error (ej: el bot no está en el grupo), retornamos falso por seguridad
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;