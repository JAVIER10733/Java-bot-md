/**
 * Java Bot MD - Comando de Limpieza (.clear)
 * Elimina el rastro del comando y la respuesta del bot para mantener el chat limpio.
 */
async function clearCommand(sock, chatId, message) {
    try {
        // 1. Enviar mensaje temporal de limpieza
        const cleanMsg = await sock.sendMessage(chatId, { 
            text: '🧹 *Limpiando el chat...*' 
        }, { quoted: message });

        // 2. Esperar 1.5 segundos para que el usuario lo vea
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 3. Auto-eliminar el mensaje del bot
        await sock.sendMessage(chatId, { delete: cleanMsg.key }).catch(() => {});

        // 4. Intentar eliminar el mensaje del comando del usuario (requiere que el bot sea admin)
        try {
            await sock.sendMessage(chatId, { delete: message.key }).catch(() => {});
        } catch (e) {
            // Si el bot no es admin, no podrá borrar el mensaje del usuario, lo cual es normal y no genera error.
        }

    } catch (error) {
        console.error('❌ Error en clearCommand:', error);
    }
}

module.exports = { clearCommand };