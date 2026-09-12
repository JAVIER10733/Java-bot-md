const axios = require('axios');

/**
 * Java Bot MD - Comando de Noticias (.news)
 * Obtiene las últimas noticias de forma fiable, con fallback automático si una API falla.
 */
async function newsCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        // 1. Reacción de procesamiento
        await sock.sendMessage(chatId, { react: { text: '📰', key: message.key } });

        let articles = [];
        const newsApiKey = process.env.NEWS_API_KEY || 'dcd720a6f1914e2d9dba9790c188c08c'; // Reemplaza con tu clave real si tienes una

        // 2. Intentar obtener noticias de NewsAPI (Fuente principal)
        try {
            const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsApiKey}`, {
                timeout: 10000
            });
            if (response.data?.status === 'ok' && response.data.articles?.length > 0) {
                articles = response.data.articles.slice(0, 5);
            } else {
                throw new Error('NewsAPI no devolvió artículos válidos');
            }
        } catch (primaryError) {
            console.warn('⚠️ NewsAPI falló (posible bloqueo de IP o clave inválida), usando fuente de respaldo...');
            
            // 3. Fallback a Spaceflight News API (100% gratuita, sin clave, nunca bloquea)
            try {
                const fallbackRes = await axios.get('https://api.spaceflightnewsapi.net/v4/articles?limit=5', {
                    timeout: 10000
                });
                if (fallbackRes.data?.results) {
                    // Mapear al formato esperado
                    articles = fallbackRes.data.results.map(item => ({
                        title: item.title,
                        description: item.summary ? item.summary.substring(0, 150) + '...' : 'Sin descripción disponible.',
                        source: { name: item.news_site || 'Spaceflight News' },
                        url: item.url
                    }));
                }
            } catch (fallbackError) {
                throw new Error('Ambas fuentes de noticias fallaron.');
            }
        }

        // 4. Validar que tengamos artículos
        if (!articles || articles.length === 0) {
            throw new Error('No se encontraron noticias disponibles en este momento.');
        }

        // 5. Construir el mensaje con diseño de tarjeta premium
        let newsMessage = `╭━━━⊱ 📰 *ÚLTIMAS NOTICIAS* ⊱━━━╮\n│\n`;
        
        articles.forEach((article, index) => {
            const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][index] || '🔹';
            const title = article.title || 'Sin título';
            const desc = article.description || 'Sin descripción disponible.';
            const source = article.source?.name || 'Fuente desconocida';
            
            newsMessage += `│  ${emoji} *${title}*\n`;
            newsMessage += `│  📝 _${desc}_\n`;
            newsMessage += `│  🔗 *Fuente:* ${source}\n│\n`;
        });

        newsMessage += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n🌍 ¡Mantente informado con *${botName}*!`;

        // 6. Enviar las noticias con el BOTÓN DEL CANAL
        await sock.sendMessage(chatId, {
            text: newsMessage,
            footer: `🤖 ${botName} | Información y Actualidad`,
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

        // 7. Reacción de éxito
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Error en newsCommand:', error.message);
        
        const botName = global.botname || 'Java Bot MD';
        const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z';

        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭━━━⊱ ❌ *ERROR DE NOTICIAS* ⊱━━━╮
│
│  No se pudieron obtener las noticias
│  en este momento.
│
│  💡 *Posibles causas:*
│  • Las APIs de noticias están saturadas.
│  • Problemas temporales de conexión.
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

module.exports = newsCommand;