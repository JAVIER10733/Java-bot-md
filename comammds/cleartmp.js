const fs = require('fs');
const path = require('path');

/**
 * Limpia un directorio específico de forma segura y recursiva.
 */
function clearDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            return { success: true, message: `El directorio '${path.basename(dirPath)}' no existe o ya está vacío.`, count: 0 };
        }
        
        const files = fs.readdirSync(dirPath);
        let deletedCount = 0;
        
        for (const file of files) {
            try {
                const filePath = path.join(dirPath, file);
                const stat = fs.lstatSync(filePath);
                
                if (stat.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filePath);
                }
                deletedCount++;
            } catch (err) {
                console.error(`❌ Error al eliminar ${file}:`, err.message);
            }
        }
        
        return { 
            success: true, 
            message: `Se limpiaron ${deletedCount} archivos en '${path.basename(dirPath)}'`, 
            count: deletedCount 
        };
    } catch (error) {
        console.error('❌ Error en clearDirectory:', error);
        return { success: false, message: `Fallo al limpiar '${path.basename(dirPath)}'`, error: error.message, count: 0 };
    }
}

/**
 * Limpia los directorios 'tmp' y 'temp' del proyecto.
 */
async function clearTmpDirectory() {
    const tmpDir = path.join(process.cwd(), 'tmp');
    const tempDir = path.join(process.cwd(), 'temp');
    
    const results = [clearDirectory(tmpDir), clearDirectory(tempDir)];
    
    const success = results.every(r => r.success);
    const totalDeleted = results.reduce((sum, r) => sum + (r.count || 0), 0);
    const message = results.map(r => r.message).join(' | ');
    
    return { success, message, count: totalDeleted };
}

/**
 * Comando manual para limpiar archivos temporales (.cleartmp)
 */
async function clearTmpCommand(sock, chatId, msg) {
    try {
        // 1. Validación de seguridad: Solo el dueño del bot
        if (!msg.key.fromMe) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Este es un comando global. Solo el *dueño del bot* puede usarlo.' 
            }, { quoted: msg });
        }

        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 2. Ejecutar limpieza
        const result = await clearTmpDirectory();
        
        // 3. Enviar respuesta con diseño premium y botón CTA
        if (result.success) {
            const successMessage = `╭━━━⊱ 🧹 *LIMPIEZA DE ARCHIVOS* ⊱━━━╮
│
│  ✅ *Estado:* Completado exitosamente
│  🗑️ *Archivos eliminados:* ${result.count}
│  📁 *Directorios:* tmp / temp
│
│  🚀 El bot ha sido optimizado y 
│  el espacio en disco ha sido liberado.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            await sock.sendMessage(chatId, {
                text: successMessage,
                footer: `🤖 ${botName} | Mantenimiento del sistema`,
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Únete a mi Canal Oficial',
                        url: channelLink,
                        merchant_url: channelLink
                    })
                }],
                headerType: 1
            }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { 
                text: `❌ *Error en la limpieza*\n\n${result.message}\n\nDetalles: ${result.error || 'Desconocido'}` 
            }, { quoted: msg });
        }

    } catch (error) {
        console.error('❌ Error en clearTmpCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Ocurrió un error inesperado al intentar limpiar los archivos temporales.' 
        }, { quoted: msg });
    }
}

/**
 * Inicia la limpieza automática cada 6 horas para prevenir sobrecarga de disco.
 */
function startAutoClear() {
    // Ejecutar inmediatamente al iniciar (silenciosamente)
    clearTmpDirectory().then(result => {
        if (!result.success) {
            console.error(`[Auto Clear] Fallo: ${result.message}`);
        } else if (result.count > 0) {
            console.log(`🧹 [Auto Clear] Se limpiaron ${result.count} archivos temporales al iniciar.`);
        }
    });

    // Programar limpieza cada 6 horas
    setInterval(async () => {
        const result = await clearTmpDirectory();
        if (!result.success) {
            console.error(`[Auto Clear] Fallo: ${result.message}`);
        } else if (result.count > 0) {
            console.log(`🧹 [Auto Clear] Se limpiaron ${result.count} archivos temporales.`);
        }
    }, 6 * 60 * 60 * 1000); // 6 horas en milisegundos
}

// Iniciar la limpieza automática
startAutoClear();

module.exports = clearTmpCommand;