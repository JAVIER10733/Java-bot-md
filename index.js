/**
 * Java Bot MD - WhatsApp Bot
 * Copyright (c) 2026 Professor
 *
 * Este programa es software libre. Puedes redistribuirlo o modificarlo
 * bajo los términos de la licencia MIT.
 *
 * Créditos:
 * - Librería Baileys por @adiwajshing
 * - Implementación de Pair Code inspirada en TechGod143 & DGXEON
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main')
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require('@whiskeysockets/baileys')
const NodeCache = require('node-cache')
const pino = require('pino')
const readline = require('readline')
const { parsePhoneNumber } = require('libphonenumber-js')
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Store ligero persistido en disco (compatible con versiones nuevas de Baileys)
const store = require('./lib/lightweight_store')
const settings = require('./settings')

// ✅ IMPORTS FALTANTES CORREGIDOS (Para evitar errores en main.js)
const { handleChatbotResponse } = require('./commands/chatbot')
const { handleTagDetection } = require('./commands/antitag')
const { handleMentionDetection } = require('./commands/mention')

// Identidad del bot
global.botname = settings.botName || 'JAVA BOT MD'
global.themeemoji = '•'
// ✅ Aquí queda guardado tu enlace del canal para usarlo en textos (sin generar botones)
global.channelLink = 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z'

// Configuración de límites de memoria
const MAX_RAM_MB = parseInt(process.env.MAX_RAM_MB, 10) || 400
const GC_INTERVAL_MS = 60_000
const RAM_CHECK_INTERVAL_MS = 30_000

/**
 * Inicializa el store de mensajes y programa su escritura periódica.
 */
function initStore() {
    store.readFromFile()
    setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)
}

/**
 * Libera memoria de forma periódica y reinicia el proceso si el consumo
 * de RAM supera el límite configurado. El panel de hosting debe reiniciar
 * el proceso automáticamente al salir con código distinto de 0.
 */
function initMemoryGuard() {
    setInterval(() => {
        if (global.gc) {
            global.gc()
            console.log(chalk.gray('🧹 Limpieza de memoria completada'))
        }
    }, GC_INTERVAL_MS)

    setInterval(() => {
        const usedMB = process.memoryUsage().rss / 1024 / 1024
        if (usedMB > MAX_RAM_MB) {
            console.log(chalk.yellow(`⚠️ RAM alta (${usedMB.toFixed(0)}MB > ${MAX_RAM_MB}MB). Reiniciando bot...`))
            process.exit(1)
        }
    }, RAM_CHECK_INTERVAL_MS)
}

function loadOwner() {
    try {
        return JSON.parse(fs.readFileSync('./data/owner.json'))
    } catch (err) {
        console.log(chalk.red('No se pudo leer ./data/owner.json. Usando el número de settings.'))
        return settings.ownerNumber
    }
}

const owner = loadOwner()
const pairingCode = process.argv.includes('--pairing-code') || !!settings.ownerNumber
const useMobile = process.argv.includes('--mobile')

// El readline solo se crea en entornos interactivos (TTY)
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null

function question(text) {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    }
    return Promise.resolve(settings.ownerNumber)
}

async function startJavaBot() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const msgRetryCounterCache = new NodeCache()

    const javaBot = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        getMessage: async (key) => {
            const jid = jidNormalizedUser(key.remoteJid)
            const msg = await store.loadMessage(jid, key.id)
            return msg?.message || ''
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })

    store.bind(javaBot.ev)
    registerMessageHandlers(javaBot)
    registerUtilities(javaBot)
    registerConnectionHandlers(javaBot, saveCreds)
    registerCallGuard(javaBot)

    if (pairingCode && !javaBot.authState.creds.registered) {
        await handlePairingCode(javaBot)
    }

    return javaBot
}

function registerMessageHandlers(javaBot) {
    javaBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return

            mek.message = mek.message.ephemeralMessage
                ? mek.message.ephemeralMessage.message
                : mek.message

            if (mek.key?.remoteJid === 'status@broadcast') {
                await handleStatus(javaBot, chatUpdate)
                return
            }

            // En modo privado se bloquean los mensajes directos (DM), no los de grupo.
            if (!javaBot.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                if (!isGroup) return
            }

            if (mek.key.id?.startsWith('BAE5') && mek.key.id.length === 16) return

            // Evita que la caché de reintentos crezca sin control
            javaBot.msgRetryCounterCache?.clear()

            try {
                await handleMessages(javaBot, chatUpdate, true)
            } catch (err) {
                console.error('Error en handleMessages:', err)
                if (mek.key?.remoteJid) {
                    // ✅ Limpio: sin contextInfo ni botones de canal
                    await javaBot.sendMessage(mek.key.remoteJid, {
                        text: '❌ Ocurrió un error al procesar tu mensaje.'
                    }).catch(console.error)
                }
            }
        } catch (err) {
            console.error('Error en messages.upsert:', err)
        }
    })

    javaBot.ev.on('messages.upsert', async (m) => {
        if (m.messages[0]?.key?.remoteJid === 'status@broadcast') {
            await handleStatus(javaBot, m)
        }
    })

    javaBot.ev.on('status.update', async (status) => {
        await handleStatus(javaBot, status)
    })

    javaBot.ev.on('messages.reaction', async (status) => {
        await handleStatus(javaBot, status)
    })
}

function registerUtilities(javaBot) {
    javaBot.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            const decoded = jidDecode(jid) || {}
            return (decoded.user && decoded.server && `${decoded.user}@${decoded.server}`) || jid
        }
        return jid
    }

    javaBot.ev.on('contacts.update', (update) => {
        for (const contact of update) {
            const id = javaBot.decodeJid(contact.id)
            if (store?.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    javaBot.getName = (jid, withoutContact = false) => {
        const id = javaBot.decodeJid(jid)
        withoutContact = javaBot.withoutContact || withoutContact

        if (id.endsWith('@g.us')) {
            return new Promise(async (resolve) => {
                let v = store.contacts[id] || {}
                if (!(v.name || v.subject)) v = javaBot.groupMetadata(id) || {}
                resolve(
                    v.name ||
                    v.subject ||
                    PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international')
                )
            })
        }

        const v = id === '0@s.whatsapp.net'
            ? { id, name: 'WhatsApp' }
            : id === javaBot.decodeJid(javaBot.user.id)
                ? javaBot.user
                : (store.contacts[id] || {})

        return (withoutContact ? '' : v.name) ||
            v.subject ||
            v.verifiedName ||
            PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    javaBot.public = settings.commandMode !== 'private'
    javaBot.serializeM = (m) => smsg(javaBot, m, store)
}

async function handlePairingCode(javaBot) {
    if (useMobile) throw new Error('No puedes usar pairing code con la API móvil')

    let phoneNumber = global.phoneNumber || settings.ownerNumber
    if (!phoneNumber) {
        phoneNumber = await question(
            chalk.bgBlack(chalk.greenBright('Escribe tu número de WhatsApp\nFormato: 5215512345678 (sin + ni espacios): '))
        )
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

    const pn = require('awesome-phonenumber')
    if (!pn('+' + phoneNumber).isValid()) {
        console.log(chalk.red('Número inválido. Ingresa tu número completo con código de país, sin + ni espacios.'))
        process.exit(1)
    }

    setTimeout(async () => {
        try {
            let code = await javaBot.requestPairingCode(phoneNumber)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            console.log(chalk.black(chalk.bgGreen('Tu código de vinculación: ')), chalk.black(chalk.white(code)))
            console.log(chalk.yellow(
                '\nIngresa este código en WhatsApp:\n1. Abre WhatsApp\n2. Ve a Ajustes > Dispositivos vinculados\n3. Toca "Vincular un dispositivo"\n4. Escribe el código que aparece arriba'
            ))
        } catch (error) {
            console.error('Error al solicitar el pairing code:', error)
            console.log(chalk.red('No se pudo obtener el código. Verifica tu número e inténtalo de nuevo.'))
        }
    }, 3000)
}

function printBanner() {
    console.log(chalk.cyan('< ================================================== >'))
    console.log(chalk.magenta(`\n${global.themeemoji} Proyecto: Java Bot MD`))
    console.log(chalk.magenta(`${global.themeemoji} Repositorio: github.com/JAVIER10733/JavaBot-MD`))
    console.log(chalk.magenta(`${global.themeemoji} Owner: ${owner}`))
    console.log(chalk.green(`${global.themeemoji} 🤖 Bot conectado correctamente ✅`))
    console.log(chalk.blue(`Versión: ${settings.version}`))
}

function registerConnectionHandlers(javaBot, saveCreds) {
    javaBot.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s

        if (connection === 'open') {
            console.log(chalk.yellow(`🌿 Conectado como: ${javaBot.user?.name || javaBot.user?.id}`))

            const botNumber = javaBot.user.id.split(':')[0] + '@s.whatsapp.net'
            // ✅ Limpio: sin contextInfo ni botones de canal
            await javaBot.sendMessage(botNumber, {
                text: `🤖 Bot conectado correctamente\n\n⏰ Hora: ${new Date().toLocaleString()}\n✅ Estado: en línea y listo\n📢 Canal: ${global.channelLink}`
            })

            await delay(1999)
            console.log(chalk.bold.blue(`\n[ ${global.botname} ]\n`))
            printBanner()
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                } catch { }
                console.log(chalk.red('Sesión cerrada. Es necesario volver a autenticarse.'))
            }
            startJavaBot()
        }
    })

    javaBot.ev.on('creds.update', saveCreds)

    javaBot.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(javaBot, update)
    })
}

function registerCallGuard(javaBot) {
    const antiCallNotified = new Set()

    javaBot.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall')
            const state = readAnticallState()
            if (!state.enabled) return

            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId
                if (!callerJid) continue

                try {
                    if (typeof javaBot.rejectCall === 'function' && call.id) {
                        await javaBot.rejectCall(call.id, callerJid)
                    } else if (typeof javaBot.sendCallOfferAck === 'function' && call.id) {
                        await javaBot.sendCallOfferAck(call.id, callerJid, 'reject')
                    }
                } catch { }

                if (!antiCallNotified.has(callerJid)) {
                    antiCallNotified.add(callerJid)
                    setTimeout(() => antiCallNotified.delete(callerJid), 60000)
                    await javaBot.sendMessage(callerJid, {
                        text: '📵 Anticall está activo. Tu llamada fue rechazada y serás bloqueado.'
                    })
                }

                setTimeout(async () => {
                    try {
                        await javaBot.updateBlockStatus(callerJid, 'block')
                    } catch { }
                }, 800)
            }
        } catch { }
    })
}

function registerProcessGuards() {
    process.on('uncaughtException', (err) => {
        console.error('Excepción no capturada:', err)
    })

    process.on('unhandledRejection', (err) => {
        console.error('Rechazo de promesa no manejado:', err)
    })
}

function watchForUpdates() {
    const file = require.resolve(__filename)
    fs.watchFile(file, () => {
        fs.unwatchFile(file)
        console.log(chalk.redBright(`Actualizando ${__filename}`))
        delete require.cache[file]
        require(file)
    })
}

// Arranque de la aplicación
initStore()
initMemoryGuard()
registerProcessGuards()

startJavaBot().catch((error) => {
    console.error('Error fatal:', error)
    process.exit(1)
})

watchForUpdates()