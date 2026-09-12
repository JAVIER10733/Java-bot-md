/**
 * Java Bot MD - Limpiador de Archivos Temporales
 * Elimina automáticamente archivos antiguos del directorio temporal para prevenir fugas de memoria y saturación del disco.
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Directorio temporal unificado (raíz del proyecto)
const TEMP_DIR = path.join(process.cwd(), 'temp');
const MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3 horas

/**
 * Limpia los archivos temporales que superan la edad máxima permitida.
 */
async function cleanupTempFiles() {
    try {
        // Si el directorio no existe, no hay nada que hacer
        if (!fsSync.existsSync(TEMP_DIR)) {
            return;
        }

        const files = await fs.readdir(TEMP_DIR);
        if (files.length === 0) return;

        const now = Date.now();
        let cleanedCount = 0;

        // Usamos un bucle for...of para esperar correctamente a cada operación asíncrona
        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            
            try {
                const stats = await fs.stat(filePath);
                
                // Eliminar archivos más antiguos que el límite establecido
                if (now - stats.mtimeMs > MAX_AGE_MS) {
                    await fs.unlink(filePath);
                    cleanedCount++;
                    console.log(`🧹 Archivo temporal eliminado: ${file}`);
                }
            } catch (err) {
                // Ignorar silenciosamente errores de archivos que ya fueron eliminados (ENOENT)
                if (err.code !== 'ENOENT') {
                    console.warn(`⚠️ No se pudo procesar el archivo ${file}:`, err.message);
                }
            }
        }

        if (cleanedCount > 0) {
            console.log(`✅ Limpieza completada: ${cleanedCount} archivo(s) temporal(es) eliminado(s).`);
        }
    } catch (error) {
        console.error('❌ Error durante la limpieza de archivos temporales:', error.message);
    }
}

// 1. Ejecutar limpieza inmediatamente al iniciar el bot
cleanupTempFiles();

// 2. Programar limpieza automática cada hora (3600000 ms)
setInterval(cleanupTempFiles, 60 * 60 * 1000);

module.exports = { cleanupTempFiles };