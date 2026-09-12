/**
 * Java Bot MD - Lightweight Store
 * Almacén minimalista y eficiente en memoria para mensajes, contactos y chats de Baileys.
 * Diseñado para prevenir fugas de memoria y reducir la E/S de disco.
 */
const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(__dirname, '..', 'baileys_store.json');

// Configuración: Mantener los últimos N mensajes por chat para minimizar el uso de RAM
let MAX_MESSAGES = 20;

// Intentar leer la configuración desde settings.js
try {
    const settings = require('../settings.js');
    if (settings.maxStoreMessages && typeof settings.maxStoreMessages === 'number') {
        // Limitar entre 5 y 100 para evitar valores extremos que rompan el bot
        MAX_MESSAGES = Math.max(5, Math.min(100, settings.maxStoreMessages));
    }
} catch (e) {
    // Usar valor por defecto si settings no está disponible
}

// Temporizador para diferir la escritura en disco (Debounce)
let writeTimeout = null;
const WRITE_DELAY_MS = 5000; // Esperar 5 segundos después del último cambio antes de escribir

const store = {
    messages: {},
    contacts: {},
    chats: {},

    /**
     * Lee el almacén desde el disco.
     * @param {string} filePath - Ruta al archivo del almacén.
     */
    readFromFile(filePath = STORE_FILE) {
        try {
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.contacts = data.contacts || {};
                this.chats = data.chats || {};
                this.messages = data.messages || {};
                
                // Limpiar datos existentes para asegurar el formato y límites actuales
                this.cleanupData();
            }
        } catch (e) {
            console.warn('⚠️ No se pudo leer el archivo del almacén, iniciando desde cero:', e.message);
            // Restablecer a estado vacío si el archivo está corrupto
            this.messages = {};
            this.contacts = {};
            this.chats = {};
        }
    },

    /**
     * Escribe el almacén en el disco con retardo (debounce) para prevenir E/S excesiva.
     * @param {string} filePath - Ruta al archivo del almacén.
     */
    writeToFile(filePath = STORE_FILE) {
        if (writeTimeout) {
            clearTimeout(writeTimeout);
        }

        writeTimeout = setTimeout(() => {
            try {
                const data = JSON.stringify({
                    contacts: this.contacts,
                    chats: this.chats,
                    messages: this.messages
                });
                fs.writeFileSync(filePath, data, 'utf-8');
            } catch (e) {
                console.error('❌ No se pudo escribir el archivo del almacén:', e.message);
            }
        }, WRITE_DELAY_MS);
    },

    /**
     * Limpia los datos del almacén para asegurar que coincidan con el formato y límites actuales.
     */
    cleanupData() {
        if (this.messages) {
            Object.keys(this.messages).forEach(jid => {
                if (Array.isArray(this.messages[jid])) {
                    // Recortar al límite máximo
                    if (this.messages[jid].length > MAX_MESSAGES) {
                        this.messages[jid] = this.messages[jid].slice(-MAX_MESSAGES);
                    }
                } else if (typeof this.messages[jid] === 'object' && this.messages[jid] !== null) {
                    // Formato antiguo (objeto en lugar de array) - convertir a array
                    const messages = Object.values(this.messages[jid]);
                    this.messages[jid] = messages.slice(-MAX_MESSAGES);
                } else {
                    // Formato inválido, restablecer a array vacío
                    this.messages[jid] = [];
                }
            });
        }
    },

    /**
     * Vincula el almacén a los eventos de Baileys.
     * @param {object} ev - El emisor de eventos de Baileys.
     */
    bind(ev) {
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (!msg.key?.remoteJid) return;
                const jid = msg.key.remoteJid;
                
                if (!this.messages[jid]) {
                    this.messages[jid] = [];
                }

                // Evitar duplicados verificando si el mensaje ya existe
                const exists = this.messages[jid].some(m => m.key.id === msg.key.id);
                if (!exists) {
                    this.messages[jid].push(msg);

                    // Recortar los antiguos para prevenir fugas de memoria
                    if (this.messages[jid].length > MAX_MESSAGES) {
                        this.messages[jid] = this.messages[jid].slice(-MAX_MESSAGES);
                    }
                    
                    // Activar escritura diferida
                    this.writeToFile();
                }
            });
        });

        ev.on('contacts.update', (contacts) => {
            let updated = false;
            contacts.forEach(contact => {
                if (contact.id) {
                    this.contacts[contact.id] = {
                        id: contact.id,
                        name: contact.notify || contact.name || contact.verifiedName || ''
                    };
                    updated = true;
                }
            });
            if (updated) this.writeToFile();
        });

        ev.on('chats.set', ({ chats }) => {
            this.chats = {};
            chats.forEach(chat => {
                this.chats[chat.id] = { 
                    id: chat.id, 
                    subject: chat.subject || chat.name || '' 
                };
            });
            this.writeToFile();
        });
        
        // Manejar actualizaciones de chats (ej: cambio de nombre del grupo)
        ev.on('chats.update', (chats) => {
            let updated = false;
            chats.forEach(chat => {
                if (chat.id && this.chats[chat.id]) {
                    if (chat.subject) this.chats[chat.id].subject = chat.subject;
                    if (chat.name) this.chats[chat.id].subject = chat.name;
                    updated = true;
                }
            });
            if (updated) this.writeToFile();
        });
    },

    /**
     * Carga un mensaje específico por su ID.
     * @param {string} jid - El ID del chat.
     * @param {string} id - El ID del mensaje.
     * @returns {object|null} El objeto del mensaje o null si no se encuentra.
     */
    async loadMessage(jid, id) {
        if (!this.messages[jid]) return null;
        return this.messages[jid].find(m => m.key.id === id) || null;
    },

    /**
     * Obtiene estadísticas sobre el almacén actual.
     * @returns {object} Estadísticas del almacén.
     */
    getStats() {
        let totalMessages = 0;
        const totalContacts = Object.keys(this.contacts).length;
        const totalChats = Object.keys(this.chats).length;
        
        Object.values(this.messages).forEach(chatMessages => {
            if (Array.isArray(chatMessages)) {
                totalMessages += chatMessages.length;
            }
        });
        
        return {
            messages: totalMessages,
            contacts: totalContacts,
            chats: totalChats,
            maxMessagesPerChat: MAX_MESSAGES
        };
    },
    
    /**
     * Fuerza la escritura inmediata del almacén en el disco (útil para cierres limpios).
     */
    forceWrite() {
        if (writeTimeout) {
            clearTimeout(writeTimeout);
            writeTimeout = null;
        }
        // Ejecutar la lógica de escritura sincrónicamente para asegurar que se guarde antes de salir
        try {
            const data = JSON.stringify({
                contacts: this.contacts,
                chats: this.chats,
                messages: this.messages
            });
            fs.writeFileSync(STORE_FILE, data, 'utf-8');
        } catch (e) {
            console.error('❌ No se pudo forzar la escritura del almacén:', e.message);
        }
    }
};

module.exports = store;