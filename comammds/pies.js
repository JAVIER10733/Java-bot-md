const fetch = require('node-fetch');

const BASE_URL = 'https://shizoapi.onrender.com/api/pies';
const VALID_COUNTRIES = ['china', 'indonesia', 'japan', 'korea', 'hijab'];

/**
 * Obtiene el buffer de la imagen de forma segura con timeout.
 */
async function fetchPiesImageBuffer(country) {
    const url = `${BASE_URL}/${country}?apikey=shizo`;
    
    // Usamos AbortController para evitar que el bot se congele si la API tarda demasiado
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos máximo

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
            throw new Error(`La API respondió con estado HTTP ${res.status}`);
        }
        
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('image')) {
            throw new Error('La API no devolvió una imagen válida');
        }
        
        return await res.buffer();
    } catch (error) {
        clearTimeout(timeoutId);
        throw new Error(error.message || 'Tiempo de espera agotado o API no disponible');
    }
}

/**
 * Java Bot MD - Comando principal de Galería (.pies)
 */
async function piesCommand(sock, chatId, message, args) {
    const botName = global.botname || 'Java Bot MD';
    const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
    const sub = (args && args[0] ? args[0] : '').toLowerCase();

    // 1. Mostrar menú de ayuda si no se proporciona país
    if (!sub) {
        const countriesList = VALID_COUNTRIES.map(c => `• *${c.charAt(0).toUpperCase() + c.slice(1)}*`).join('\n');
        
        return await sock.sendMessage(chatId, {
            text: `╭━━━⊱ 🌸 *GALERÍA DE IMÁGENES* ⊱━━━╮
│
│  Explora nuestra colección de 
│  imágenes temáticas de alta calidad.
│
│  🌍 *Países/Temas disponibles:*
│  ${countriesList}
│
│  💡 *Uso:* .pies <tema>
│  💡 *Ejemplo:* .pies japan
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Entretenimiento`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });
    }

    // 2. Validar que el país sea soportado
    if (!VALID_COUNTRIES.includes(sub)) {
        return await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *TEMA NO SOPORTADO* ⊱━━━╮
│
│  El tema "${sub}" no está disponible.
│
│  🌍 *Prueba con uno de estos:*
│  ${VALID_COUNTRIES.map(c => `• ${c}`).join('\n  ')}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Entretenimiento`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });
    }

    // 3. Ejecutar la lógica de obtención de imagen
    await processPiesImage(sock, chatId, message, sub, botName, channelLink);
}

/**
 * Java Bot MD - Comando alias para Galería (.china, .japan, etc.)
 */
async function piesAlias(sock, chatId, message, country) {
    const botName = global.botname || 'Java Bot MD';
    const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';
    
    await processPiesImage(sock, chatId, message, country, botName, channelLink);
}

/**
 * Lógica central compartida para obtener y enviar la imagen.
 */
async function processPiesImage(sock, chatId, message, country, botName, channelLink) {
    try {
        // Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🖼️', key: message.key } });

        // Obtener la imagen
        const imageBuffer = await fetchPiesImageBuffer(country);
        const formattedCountry = country.charAt(0).toUpperCase() + country.slice(1);

        // Enviar la imagen con diseño premium
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `╭━━━⊱ 🌸 *GALERÍA: ${formattedCountry}* ⊱━━━╮
│
│  ✨ Imagen seleccionada 
│  aleatoriamente para ti.
│
│  🤖 Generado por *${botName}*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Entretenimiento`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Únete a mi Canal Oficial',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });

        // Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error(`❌ Error en el comando pies (${country}):`, error.message);
        
        // Reacción de error
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE CARGA* ⊱━━━╮
│
│  No se pudo obtener la imagen en 
│  este momento.
│
│  💡 *Posibles causas:*
│  • La API está temporalmente saturada.
│  • El servidor de imágenes está en 
│    mantenimiento.
│
│  Intenta de nuevo en unos minutos.
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            footer: `🤖 ${botName} | Soporte técnico`,
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Reportar en el Canal',
                    url: channelLink,
                    merchant_url: channelLink
                })
            }],
            headerType: 1
        }, { quoted: message });
    }
}

module.exports = { piesCommand, piesAlias, VALID_COUNTRIES };