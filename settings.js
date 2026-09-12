require('dotenv').config();

const settings = {
  packname: 'Java Bot MD',
  botName: process.env.BOT_NAME || 'Java Bot MD',
  author: process.env.BOT_AUTHOR || 'Java Bot Team',
  botOwner: process.env.BOT_OWNER || 'Professor',
  ownerNumber: process.env.OWNER_NUMBER || '',
  giphyApiKey: process.env.GIPHY_API_KEY || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: process.env.COMMAND_MODE || 'public',
  maxStoreMessages: parseInt(process.env.MAX_STORE_MESSAGES, 10) || 20,
  storeWriteInterval: parseInt(process.env.STORE_WRITE_INTERVAL, 10) || 10000,
  description: 'Bot profesional para gestión de grupos y automatización de tareas.',
  version: '4.0.0',
};

function validateSettings(config) {
  const required = ['botName', 'ownerNumber', 'commandMode'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Faltan campos obligatorios en settings: ${missing.join(', ')}`);
  }

  const validModes = ['public', 'private'];
  if (!validModes.includes(config.commandMode)) {
    throw new Error(`commandMode inválido. Usa: ${validModes.join(' o ')}`);
  }

  return true;
}

validateSettings(settings);

module.exports = settings;
