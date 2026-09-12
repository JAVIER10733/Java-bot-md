/**
 * Java Bot MD - Comando OSINT: IP Lookup (.iplookup)
 * Rastrea información geográfica y técnica de una dirección IP pública.
 * API utilizada: ipapi.co (gratuita, sin API key para uso básico)
 */
const axios = require('axios');
const { isPremiumUser, sendPremiumLockedMessage } = require('./utils');

const BOT_NAME = global.botname || 'Java Bot MD';
const IP_API_URL = 'https://ipapi.co';

/**
 * Valida el formato de una dirección IPv4.
 * @param {string} ip - Dirección IP a validar.
 * @returns {boolean} True si es válida.
 */
function isValidIPv4(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip.trim());
}

/**
 * Valida el formato de una dirección IPv6 (básico).
 * @param {string} ip - Dirección IP a validar.
 * @returns {boolean} True si es válida.
 */
function isValidIPv6(ip) {
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv6Regex.test(ip.trim());
}

/**
 * Comando principal: .iplookup <dirección IP>
 */
async function ipLookupCommand(sock, chatId, message, targetIP) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;

        // 1. Verificar acceso Premium
      if (!(await isPremiumUser(senderId, message.key.fromMe))) {
            return sendPremiumLockedMessage(sock, chatId, message);
        }

        // 2. Validar que se haya proporcionado una IP
        if (!targetIP) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱  *USO INCORRECTO* ⊱━━━╮
│
│  Debes proporcionar una dirección 
│  IP para realizar el rastreo.
│
│  💡 *Ejemplos:*
│  • .iplookup 8.8.8.8
│  • .iplookup 1.1.1.1
│  • .iplookup 200.58.110.45
│
│  📝 *Formatos aceptados:*
│  • IPv4 (ej: 192.168.1.1)
│  • IPv6 (ej: 2001:0db8:85a3::8a2e)
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        const cleanIP = targetIP.trim();

        // 3. Validar formato de IP
        if (!isValidIPv4(cleanIP) && !isValidIPv6(cleanIP)) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *IP INVÁLIDA* ⊱━━━╮
│
│  El formato proporcionado no es una 
│  dirección IP válida.
│
│  🔍 *IP recibida:* _${cleanIP}_
│
│  💡 *Recuerda:*
│  • IPv4: 4 octetos separados por puntos
│    (ej: 8.8.8.8)
│  • IPv6: 8 grupos hexadecimales
│    (ej: 2001:0db8:85a3::8a2e)
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        // 4. Rechazar IPs privadas/locales (no tienen información pública)
        const isPrivateIP = (ip) => {
            const privateRanges = [
                /^10\./,
                /^172\.(1[6-9]|2\d|3[01])\./,
                /^192\.168\./,
                /^127\./,
                /^169\.254\./,
                /^::1$/,
                /^fc00:/,
                /^fe80:/
            ];
            return privateRanges.some(range => range.test(ip));
        };

        if (isPrivateIP(cleanIP)) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ⚠️ *IP PRIVADA DETECTADA* ⊱━━━
│
│  La dirección _${cleanIP}_ es una IP 
│  privada o local (red interna).
│
│  🚫 No es posible rastrear IPs 
│  privadas ya que no tienen 
│  información geográfica pública.
│
│  💡 *Usa una IP pública como:*
│  • 8.8.8.8 (Google DNS)
│  • 1.1.1.1 (Cloudflare)
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        // 5. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🌐', key: message.key } });

        // 6. Consultar la API de ipapi.co
        const response = await axios.get(`${IP_API_URL}/${cleanIP}/json/`, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const data = response.data;

        // 7. Validar respuesta de la API
        if (data.error) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━ ❌ *ERROR DE API* ⊱━━━╮
│
│  La API de geolocalización reportó 
│  un error al procesar tu solicitud.
│
│  📋 *Motivo:* ${data.reason || 'Desconocido'}
│   *IP:* ${cleanIP}
│
│  💡 *Posibles causas:*
│  • La IP no existe o es inválida
│  • La API está temporalmente caída
│  • Límite de consultas excedido
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `${BOT_NAME} · OSINT Premium`
            }, { quoted: message });
        }

        // 8. Formatear y enviar la respuesta
        const flagEmoji = data.country_code ? getFlagEmoji(data.country_code) : '🌍';
        const isp = data.org || data.asn || 'Desconocido';
        const timezone = data.timezone || 'Desconocido';
        const currency = `${data.currency || '?'} (${data.currency_name || 'N/A'})`;
        const location = `${data.city || 'Desconocida'}, ${data.region || 'N/A'}, ${data.country_name || 'N/A'}`;
        const coordinates = data.latitude && data.longitude 
            ? `${data.latitude}, ${data.longitude}` 
            : 'No disponibles';

        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 🌐 *REPORTE DE IP* ⊱━━━╮
│
│  🔍 *IP Objetivo:* \`${cleanIP}\`
│  ${flagEmoji} *País:* ${data.country_name || 'Desconocido'}
│  📍 *Ubicación:* ${location}
│  🗺️ *Coordenadas:* ${coordinates}
│  🏙️ *Código Postal:* ${data.postal || 'N/A'}
│
│  📶 *ISP / Organización:*
│  _${isp}_
│
│  🕐 *Zona Horaria:* ${timezone}
│  💱 *Moneda:* ${currency}
│  🌐 *Idioma:* ${data.languages || 'N/A'}
│
│  🔒 *Es VPN/Proxy:* ${data.anonymous || data.vpn ? '️ Sí (posible)' : '✅ No detectado'}
│
│   *ASN:* ${data.asn || 'N/A'}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `${BOT_NAME} · OSINT Premium · Datos de ipapi.co`
        }, { quoted: message });

        // 9. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en ipLookupCommand:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        let errorMsg = '❌ Ocurrió un error al procesar la solicitud de OSINT.';
        if (error.code === 'ECONNABORTED') {
            errorMsg = '⏱️ La API tardó demasiado en responder. Inténtalo de nuevo.';
        } else if (error.response?.status === 429) {
            errorMsg = '🚫 Límite de consultas a la API excedido. Espera unos minutos.';
        } else if (error.response?.status === 404) {
            errorMsg = '❓ La IP no fue encontrada en la base de datos.';
        }
        
        await sock.sendMessage(chatId, {
            text: errorMsg,
            footer: `${BOT_NAME} · Soporte Técnico`
        }, { quoted: message });
    }
}

/**
 * Convierte un código de país ISO a emoji de bandera.
 * @param {string} countryCode - Código de 2 letras (ej: 'EC', 'US')
 * @returns {string} Emoji de bandera
 */
function getFlagEmoji(countryCode) {
    try {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    } catch {
        return '🌍';
    }
}

module.exports = ipLookupCommand;