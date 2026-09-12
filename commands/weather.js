const axios = require('axios');

/**
 * Java Bot MD - Comando de Clima en Tiempo Real (.weather / .clima)
 * Muestra un reporte meteorológico detallado y visualmente atractivo.
 */
async function weatherCommand(sock, chatId, message, cityArg) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Extraer la ciudad (soporta parámetro directo o extracción del texto)
        let city = cityArg;
        if (!city) {
            const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
            city = text.replace(/^\.?(weather|clima)\s*/i, '').trim();
        }

        // 2. Validar que se haya proporcionado una ciudad
        if (!city || city.length < 2) {
            return await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🌤️ *CLIMA EN TIEMPO REAL* ⊱━━━╮
│
│  Consulta el estado del tiempo, 
│  temperatura y humedad de cualquier 
│  ciudad del mundo.
│
│  💡 *Uso:* .clima <nombre de la ciudad>
│  💡 *Ejemplo:* .clima Quito
│  💡 *Ejemplo:* .clima Tokyo, Japan
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
                footer: `🤖 ${botName} | Información útil`,
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

        // 3. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '🌤️', key: message.key } });

        // 4. Consulta a la API con Timeout (10 segundos) y lenguaje en español
        const apiKey = process.env.OPENWEATHER_API_KEY || '4902c0f2550f58298ad4146a92b65e10'; // Reemplaza con tu clave si tienes una de pago
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=es`;
        
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const w = response.data;

        // 5. Mapeo de condiciones climáticas a emojis para mayor impacto visual
        const weatherEmojis = {
            'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Drizzle': '🌦️',
            'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️', 'Smoke': '🌫️',
            'Haze': '🌫️', 'Dust': '🌪️', 'Fog': '🌫️', 'Sand': '🏜️', 
            'Ash': '🌋', 'Squall': '🌬️', 'Tornado': '🌪️'
        };
        const mainCondition = w.weather[0].main;
        const emoji = weatherEmojis[mainCondition] || '🌤️';
        
        // Capitalizar la descripción (ej: "cielo claro" -> "Cielo claro")
        const description = w.weather[0].description.charAt(0).toUpperCase() + w.weather[0].description.slice(1);

        // 6. Construir el mensaje con diseño de tarjeta premium
        const weatherMessage = `╭━━━⊱ 🌤️ *CLIMA EN ${w.name.toUpperCase()}* ⊱━━━╮
│
│  🌡️ *Temperatura:* ${w.main.temp}°C (Sensación: ${w.main.feels_like}°C)
│  ☁️ *Condición:* ${description} ${emoji}
│  💧 *Humedad:* ${w.main.humidity}%
│  💨 *Viento:* ${w.wind.speed} m/s
│  🌍 *País:* ${w.sys.country}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📡 Datos proporcionados por OpenWeatherMap`;

        // 7. Enviar el reporte con el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: weatherMessage,
            footer: `🤖 ${botName} | Información útil`,
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

        // 8. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en weatherCommand:', error.message);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });

        // Manejo específico de errores
        if (error.response?.status === 404) {
            await sock.sendMessage(chatId, {
                text: `╭━━━⊱ 🔍 *CIUDAD NO ENCONTRADA* ⊱━━━╮
│
│  No se encontraron datos para:
│  _"${city}"_
│
│  💡 *Consejo:* Verifica la ortografía 
│  o añade el país (ej: "Lima, Peru").
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
        } else if (error.code === 'ECONNABORTED') {
            await sock.sendMessage(chatId, { text: '⏰ *Tiempo de espera agotado.* El servidor de clima no respondió a tiempo. Inténtalo de nuevo.' }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `╭━━━⊱ ❌ *ERROR DE CONEXIÓN* ⊱━━━╮
│
│  Ocurrió un problema al obtener el 
│  clima. Es posible que la API esté 
│  saturada o sin conexión.
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
}

module.exports = weatherCommand;