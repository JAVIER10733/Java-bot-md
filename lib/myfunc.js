/**
 * Java Bot MD - Funciones de Utilidad (myfunc)
 * Copyright (c) 2026 Professor
 * 
 * Este programa es software libre: puedes redistribuirlo y/o modificarlo
 * bajo los términos de la Licencia MIT.
 */
const { proto, getContentType } = require('@whiskeysockets/baileys');
const chalk = require('chalk');
const fs = require('fs');
const axios = require('axios');
const moment = require('moment-timezone');
const { sizeFormatter } = require('human-readable');
const util = require('util');
const Jimp = require('jimp');
const path = require('path');

// Zona horaria configurada para Ecuador (Ventanas, Los Ríos)
const TIMEZONE = 'America/Guayaquil';

exports.unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000);

exports.generateMessageTag = (epoch) => {
    let tag = exports.unixTimestampSeconds().toString();
    if (epoch) tag += '.--' + epoch;
    return tag;
};

exports.processTime = (timestamp, now) => {
    return moment.duration(now - moment(timestamp * 1000)).asSeconds();
};

exports.getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

exports.getBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Requests': 1,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (err) {
        console.error('❌ Error en getBuffer:', err.message);
        return null;
    }
};

exports.fetchJson = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        console.error('❌ Error en fetchJson:', err.message);
        return null;
    }
};

exports.runtime = function(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    
    const dDisplay = d > 0 ? d + (d === 1 ? " día, " : " días, ") : "";
    const hDisplay = h > 0 ? h + (h === 1 ? " hora, " : " horas, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minuto, " : " minutos, ") : "";
    const sDisplay = s > 0 ? s + (s === 1 ? " segundo" : " segundos") : "";
    
    return dDisplay + hDisplay + mDisplay + sDisplay;
};

exports.clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
};

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

exports.isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'));
};

exports.getTime = (format, date) => {
    const targetDate = date ? new Date(date) : new Date();
    return moment(targetDate).tz(TIMEZONE).locale('es').format(format);
};

exports.formatDate = (n, locale = 'es-EC') => {
    const d = new Date(n);
    return d.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });
};

exports.formatp = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
});

exports.json = (string) => {
    return JSON.stringify(string, null, 2);
};

exports.format = (...args) => util.format(...args);

exports.logic = (check, inp, out) => {
    if (inp.length !== out.length) throw new Error('Input and Output must have same length');
    for (let i in inp) {
        if (util.isDeepStrictEqual(check, inp[i])) return out[i];
    }
    return null;
};

exports.generateProfilePicture = async (buffer) => {
    try {
        const jimp = await Jimp.read(buffer);
        const min = jimp.getWidth();
        const max = jimp.getHeight();
        const cropped = jimp.crop(0, 0, min, max);
        return {
            img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
            preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
        };
    } catch (err) {
        console.error('❌ Error al generar foto de perfil:', err);
        throw err;
    }
};

exports.bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

exports.getSizeMedia = async (path) => {
    try {
        if (/http/.test(path)) {
            const res = await axios.head(path);
            const length = parseInt(res.headers['content-length'], 10);
            if (!isNaN(length)) return exports.bytesToSize(length, 2);
        } else if (Buffer.isBuffer(path)) {
            const length = Buffer.byteLength(path);
            if (!isNaN(length)) return exports.bytesToSize(length, 2);
        }
        return 'Desconocido';
    } catch (err) {
        return 'Desconocido';
    }
};

exports.parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
};

exports.getGroupAdmins = (participants) => {
    const admins = [];
    for (const i of participants) {
        if (i.admin === "superadmin" || i.admin === "admin") {
            admins.push(i.id);
        }
    }
    return admins;
};

/**
 * Serializa el mensaje para facilitar su manejo en los comandos.
 * @param {object} sock - Instancia del socket de Baileys.
 * @param {object} m - Objeto del mensaje crudo.
 * @param {object} store - Almacén de mensajes.
 * @returns {object} Mensaje serializado.
 */
exports.smsg = (sock, m, store) => {
    if (!m) return m;
    const M = proto.WebMessageInfo;

    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = sock.decodeJid(m.fromMe && sock.user.id || m.participant || m.key.participant || m.chat || '');
        if (m.isGroup) m.participant = sock.decodeJid(m.key.participant) || '';
    }

    if (m.message) {
        m.mtype = getContentType(m.message);
        
        // Manejo robusto de mensajes efímeros y de vista única (viewOnce)
        const isViewOnce = m.mtype === 'viewOnceMessage' || m.mtype === 'viewOnceMessageV2';
        const actualMessage = isViewOnce ? m.message[m.mtype].message : m.message;
        const actualMtype = isViewOnce ? getContentType(actualMessage) : m.mtype;
        
        m.msg = actualMessage[actualMtype] || m.message[m.mtype];
        
        m.body = m.message.conversation || 
                 m.msg.caption || 
                 m.msg.text || 
                 (m.mtype === 'listResponseMessage' && m.msg.singleSelectReply?.selectedRowId) || 
                 (m.mtype === 'buttonsResponseMessage' && m.msg.selectedButtonId) || 
                 (isViewOnce && m.msg.caption) || 
                 m.text || '';

        const contextInfo = m.msg.contextInfo || {};
        m.mentionedJid = contextInfo.mentionedJid || [];
        
        const quoted = m.quoted = contextInfo.quotedMessage || null;
        
        if (m.quoted) {
            const type = getContentType(m.quoted);
            m.quoted = m.quoted[type];
            
            if (['productMessage'].includes(type)) {
                const subType = getContentType(m.quoted);
                m.quoted = m.quoted[subType];
            }
            
            if (typeof m.quoted === 'string') {
                m.quoted = { text: m.quoted };
            }
            
            m.quoted.mtype = type;
            m.quoted.id = contextInfo.stanzaId;
            m.quoted.chat = contextInfo.remoteJid || m.chat;
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
            m.quoted.sender = sock.decodeJid(contextInfo.participant);
            m.quoted.fromMe = m.quoted.sender === sock.decodeJid(sock.user.id);
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
            m.quoted.mentionedJid = contextInfo.mentionedJid || [];
            
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return null;
                const q = await store.loadMessage(m.chat, m.quoted.id, sock);
                return q ? exports.smsg(sock, q, store) : null;
            };
            
            const vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            });

            m.quoted.delete = () => sock.sendMessage(m.quoted.chat, { delete: vM.key });
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => sock.copyNForward(jid, vM, forceForward, options);
            m.quoted.download = () => sock.downloadMediaMessage(m.quoted);
        }
    }

    if (m.msg?.url) {
        m.download = () => sock.downloadMediaMessage(m.msg);
    }

    m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || '';

    // Método de respuesta rápida y segura
    m.reply = (text, chatId = m.chat, options = {}) => {
        if (Buffer.isBuffer(text)) {
            return sock.sendMessage(chatId, { image: text, ...options }, { quoted: m });
        }
        return sock.sendMessage(chatId, { text, ...options }, { quoted: m });
    };

    m.copy = () => exports.smsg(sock, M.fromObject(M.toObject(m)));
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => sock.copyNForward(jid, m, forceForward, options);

    return m;
};

exports.reSize = async (buffer, ukur1, ukur2) => {
    try {
        const jimp = await Jimp.read(buffer);
        return await jimp.resize(ukur1, ukur2).getBufferAsync(Jimp.MIME_JPEG);
    } catch (err) {
        console.error('❌ Error en reSize:', err);
        throw err;
    }
};

// Recarga automática del archivo en modo desarrollo (Hot Reload)
const file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`🔄 Actualizado: ${path.basename(__filename)}`));
    delete require.cache[file];
    require(file);
});