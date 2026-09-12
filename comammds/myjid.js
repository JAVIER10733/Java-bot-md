/**
 * Comando de diagnóstico: muestra tu JID exacto y verifica si eres el dueño.
 */
async function myjidCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const settings = require('../settings');
    
    const ownerNumber = String(settings.ownerNumber || '').replace(/\D/g, '');
    const ownerJid = `${ownerNumber}@s.whatsapp.net`;
    const normalizedSender = senderId.split(':')[0];
    const isFromMe = message.key.fromMe;
    
    const text = `━━━⊱ 🔍 *DIAGNÓSTICO DE USUARIO* ⊱━━━╮
│
│  📱 *Tu JID completo:*
│  \`${senderId}\`
│
│   *Tu JID normalizado:*
│  \`${normalizedSender}\`
│
│  👑 *Owner en settings.js:*
│  \`${ownerNumber}\`
│
│   *Owner JID esperado:*
│  \`${ownerJid}\`
│
│  ✅ *¿Mensaje fromMe?* ${isFromMe ? 'SÍ (eres el dueño)' : 'NO'}
│  🎯 *¿JID coincide con owner?* ${normalizedSender === ownerNumber ? 'SÍ' : 'NO'}
│
│  💡 *Conclusión:*
│  ${isFromMe 
      ? '✅ Tienes acceso total (fromMe = true)' 
      : normalizedSender === ownerNumber 
          ? '✅ Eres el dueño (JID coincide)' 
          : '⚠️ Tu JID no coincide con ownerNumber'}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
    
    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = myjidCommand;