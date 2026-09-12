<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=30&pause=1000&color=00FF88&center=true&vCenter=true&width=900&lines=JAVA+BOT+MD;WhatsApp+Multi-Device+Bot;Enterprise+Edition+2026" alt="Typing SVG" />

  <br><br>

  <img src="https://img.shields.io/badge/Node.js-18.x+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/WhatsApp-Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp">
  <img src="https://img.shields.io/badge/FFmpeg-Media-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Status-Activo-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Versión-3.1.0-blue?style=for-the-badge" alt="Version">

  <br><br>

  <img src="https://raw.githubusercontent.com/JAVIER10733/Java-bot-Md/main/assets/bot_image.jpg" alt="Java Bot MD Banner" width="650" style="border-radius: 16px; border: 2px solid #00FF88;">

  <br><br>

  <a href="https://github.com/JAVIER10733/Java-bot-Md/stargazers"><img src="https://img.shields.io/github/stars/JAVIER10733/Java-bot-Md?style=for-the-badge&color=yellow" alt="Stars"></a>
  <a href="https://github.com/JAVIER10733/Java-bot-Md/network/members"><img src="https://img.shields.io/github/forks/JAVIER10733/Java-bot-Md?style=for-the-badge&color=blue" alt="Forks"></a>
  <a href="https://github.com/JAVIER10733/Java-bot-Md/issues"><img src="https://img.shields.io/github/issues/JAVIER10733/Java-bot-Md?style=for-the-badge&color=red" alt="Issues"></a>
</div>

<br>

<div align="center">
  <b>Java Bot MD</b> automatiza WhatsApp con moderación, descargas e inteligencia artificial. Corre en Node.js y usa la librería Baileys.
</div>

<br>

<div align="center">
  <a href="#-instalación-rápida"><b>Instalación</b></a> •
  <a href="#-referencia-de-comandos"><b>Comandos</b></a> •
  <a href="#-referencia-de-api-interna"><b>API</b></a> •
  <a href="#-guía-de-desarrollo-de-plugins"><b>Plugins</b></a> •
  <a href="#-arquitectura"><b>Arquitectura</b></a> •
  <a href="#-soporte"><b>Soporte</b></a>
</div>

---

## 📑 Índice

1. [Stack tecnológico](#-stack-tecnológico)
2. [Funciones principales](#-funciones-principales)
3. [Instalación rápida](#-instalación-rápida)
4. [Instalación local](#-instalación-local)
5. [Configuración](#-configuración)
6. [Referencia de comandos](#-referencia-de-comandos)
7. [Referencia de API interna](#-referencia-de-api-interna)
8. [Guía de desarrollo de plugins](#-guía-de-desarrollo-de-plugins)
9. [Modelo de datos](#-modelo-de-datos)
10. [Sistema de eventos](#-sistema-de-eventos)
11. [Arquitectura](#-arquitectura)
12. [Seguridad](#-seguridad)
13. [Testing](#-testing)
14. [Rendimiento y escalado](#-rendimiento-y-escalado)
15. [Solución de problemas](#-solución-de-problemas)
16. [Preguntas frecuentes](#-preguntas-frecuentes)
17. [Contribuir](#-contribuir)
18. [Roadmap](#-roadmap)
19. [Changelog](#-changelog)
20. [Soporte](#-soporte)
21. [Créditos](#-créditos)
22. [Licencia](#-licencia)

---

## 💻 Stack tecnológico

| Tecnología | Función | Versión mínima |
|:---|:---|:---|
| [Node.js](https://nodejs.org/) | Ejecuta el servidor | 18.x |
| [Baileys](https://github.com/WhiskeySockets/Baileys) | Conecta con WhatsApp | Latest |
| [FFmpeg](https://ffmpeg.org/) | Procesa audio y video | 5.x+ |
| [Sharp](https://sharp.pixelplumbing.com/) | Optimiza imágenes | 0.32.x |
| [Axios](https://axios-http.com/) | Gestiona peticiones HTTP | 1.x |
| [Node-ID3](https://github.com/Zazama/node-id3) | Añade metadatos a audio | Latest |
| [PM2](https://pm2.keymetrics.io/) | Mantiene el proceso activo | 5.x |
| [Pino](https://getpino.io/) | Registra logs estructurados | 8.x |

---

## ✨ Funciones principales

### Moderación
- Anti-link: elimina enlaces no autorizados y registra infracciones.
- Anti-badword: filtra lenguaje ofensivo con 3 niveles de sanción.
- Anti-tag: bloquea el spam de menciones masivas.
- Anti-spam: detecta mensajes repetidos en ventanas de tiempo cortas.
- Bienvenida y despedida: mensajes personalizados con variables `{user}` y `{group}`.
- Sistema de advertencias: acumula strikes y expulsa tras un límite configurable.

### Descargas
- YouTube: audio en MP3 con metadatos, video en MP4 en máxima resolución.
- TikTok: video sin marca de agua.
- Instagram: reels, posts, stories e IGTV.
- Facebook y Spotify: descarga directa con datos de la pista.
- Mediafire y Google Drive: descarga directa de archivos compartidos.

### Inteligencia artificial
- ChatGPT y Blackbox con memoria de conversación por usuario.
- Generación de imágenes con DALL-E y Flux.
- Generación de clips de video a partir de texto.
- Transcripción de audio a texto.

### Creación de contenido
- Stickers: convierte imagen, video o GIF a WebP en segundos.
- Text effects: 18 estilos de texto listos para usar.
- Photo editor: blur, quitar fondo, mejorar calidad, emoji mix.

---

## 🚀 Instalación rápida

### Paso 1. Haz fork del repositorio
Copia el código a tu cuenta para editarlo y mantenerlo actualizado.

<div align="center">
  <a href="https://github.com/JAVIER10733/Java-bot-Md/fork">
    <img src="https://img.shields.io/badge/Hacer_Fork-181717?style=for-the-badge&logo=github&logoColor=white" alt="Fork">
  </a>
</div>

### Paso 2. Genera tu pair code
Vincula tu número sin escanear un código QR.

<div align="center">
  <a href="https://knight-bot-paircode.onrender.com">
    <img src="https://img.shields.io/badge/Obtener_Pair_Code-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Pair Code">
  </a>
</div>

Sube el archivo `creds.json` a la carpeta `session/` de tu repositorio.

### Paso 3. Elige tu plataforma de despliegue

| Plataforma | Tipo | Enlace |
|:---|:---|:---|
| Tutorial en video | Guía paso a paso | [Ver tutorial](https://youtu.be/-oz_u1iMgf8) |
| Bot Hosting Panel | Panel gratuito | [Desplegar](https://bot-hosting.net/?aff=1068419752923508776) |
| Petrosky VPS | Servidor privado | [Contratar](https://client.petrosky.io/aff.php?aff=394) |
| Katabump Panel | Panel alternativo | [Desplegar](https://dashboard.katabump.com/auth/login#d6b7d6) |

---

## ⚙️ Instalación local

### Requisitos
- Node.js 18.x o superior
- Git
- FFmpeg
- NPM o Yarn

### Linux o Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt install git ffmpeg -y

git clone https://github.com/JAVIER10733/Java-bot-Md.git
cd Java-bot-Md
npm install
node index.js

npm install -g pm2
pm2 start index.js --name "java-bot"
pm2 save
pm2 startup
```

### Docker

```bash
git clone https://github.com/JAVIER10733/Java-bot-Md.git
cd Java-bot-Md
docker build -t java-bot-md .

docker run -d \
  --name java-bot \
  --restart unless-stopped \
  -v ./session:/app/session \
  -v ./data:/app/data \
  java-bot-md

docker logs -f java-bot
```

### Windows

```powershell
# Instala Node.js desde nodejs.org antes de continuar
git clone https://github.com/JAVIER10733/Java-bot-Md.git
cd Java-bot-Md
npm install
node index.js
```

---

## 🔐 Configuración

### `settings.js`

```javascript
global.botName = "Java Bot MD";
global.ownerNumber = "593999999999";
global.packname = "Java Bot MD";
global.author = "Professor";
global.channelLink = "https://whatsapp.com/channel/...";
global.prefix = ".";
global.mode = "public";
global.maxWarnings = 3;
global.antiSpamWindowMs = 10000;
```

### `.env`

```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
MAX_RAM_MB=512
NODE_ENV=production
DEBUG=false
OPENAI_API_KEY=tu_key_aqui
```

---

## 📜 Referencia de comandos

Todos los comandos usan el prefijo `.`. Ejemplo: `.help`

### Moderación

| Comando | Función | Permiso |
|:---|:---|:---|
| `.tagall` | Etiqueta a todo el grupo | Admin |
| `.tagnotadmin` | Etiqueta solo a los no admin | Admin |
| `.hidetag` | Etiqueta sin mostrar el símbolo @ | Admin |
| `.kick` | Expulsa a un usuario | Admin |
| `.promote` / `.demote` | Asciende o degrada a un usuario | Admin |
| `.mute` / `.unmute` | Silencia o activa el grupo | Admin |
| `.antilink on/off` | Activa o desactiva el filtro de enlaces | Admin |
| `.antibadword on/off` | Activa o desactiva el filtro de palabras | Admin |
| `.warn` / `.unwarn` | Añade o retira una advertencia | Admin |
| `.welcome` / `.goodbye` | Configura los mensajes de entrada y salida | Admin |

**Ejemplo de implementación (`commands/moderation/kick.js`):**

```javascript
module.exports = {
  name: "kick",
  category: "moderation",
  permission: "admin",
  description: "Expulsa a un usuario del grupo",
  async execute(sock, msg, args, context) {
    const { groupJid, mentionedJid, isBotAdmin } = context;

    if (!isBotAdmin) {
      return sock.sendMessage(groupJid, { text: "Necesito ser admin para expulsar usuarios." });
    }
    if (!mentionedJid.length) {
      return sock.sendMessage(groupJid, { text: "Menciona o responde al usuario que quieres expulsar." });
    }

    await sock.groupParticipantsUpdate(groupJid, mentionedJid, "remove");
    return sock.sendMessage(groupJid, { text: "Usuario expulsado correctamente." });
  }
};
```

### Descargas

| Comando | Función | Ejemplo |
|:---|:---|:---|
| `.play` | Descarga audio de YouTube | `.play bad bunny monaco` |
| `.video` | Descarga video de YouTube | `.video tutorial nodejs` |
| `.tiktok` | Descarga video de TikTok sin marca | `.tiktok https://...` |
| `.instagram` | Descarga posts o reels | `.ig https://...` |
| `.spotify` | Busca y descarga una canción | `.spotify shape of you` |
| `.mediafire` | Descarga un archivo de Mediafire | `.mediafire https://...` |

**Ejemplo de implementación (`commands/download/play.js`):**

```javascript
const ytSearch = require("../../lib/ytSearch");
const ytDownload = require("../../lib/ytDownload");

module.exports = {
  name: "play",
  category: "download",
  permission: "public",
  description: "Descarga audio de YouTube",
  async execute(sock, msg, args, context) {
    const query = args.join(" ");
    if (!query) {
      return sock.sendMessage(context.jid, { text: "Escribe el nombre de la canción." });
    }

    const [result] = await ytSearch(query);
    if (!result) {
      return sock.sendMessage(context.jid, { text: "No encontré resultados." });
    }

    const buffer = await ytDownload(result.url, "audio");
    return sock.sendMessage(context.jid, {
      audio: buffer,
      mimetype: "audio/mpeg",
      fileName: `${result.title}.mp3`
    });
  }
};
```

### Inteligencia artificial

| Comando | Función | Ejemplo |
|:---|:---|:---|
| `.ia` / `.gpt` | Consulta a la IA | `.ia ¿Qué es Node.js?` |
| `.imagine` | Genera una imagen | `.imagine un gato astronauta` |
| `.sora` | Genera un video corto | `.sora un perro corriendo` |
| `.transcribe` | Transcribe un audio a texto | Responde a un audio con `.transcribe` |

### Stickers

| Comando | Función | Uso |
|:---|:---|:---|
| `.sticker` / `.s` | Convierte imagen o video a sticker | Responde a un medio con `.s` |
| `.take` | Cambia el paquete y autor del sticker | `.take Mi Paquete` |
| `.toimg` | Convierte sticker a imagen | Responde a un sticker con `.toimg` |
| `.tg` | Descarga un pack de Telegram | `.tg https://t.me/...` |

### Utilidades y propietario

| Comando | Función | Permiso |
|:---|:---|:---|
| `.translate` | Traduce texto | Todos |
| `.ss` | Captura un sitio web | Todos |
| `.ping` | Muestra la velocidad de respuesta | Todos |
| `.mode` | Cambia entre público y privado | Owner |
| `.sudo add/del` | Gestiona usuarios con privilegios | Owner |
| `.cleartmp` | Limpia archivos temporales | Owner |
| `.broadcast` | Envía un mensaje a todos los grupos | Owner |

---

## 🧩 Referencia de API interna

El bot expone funciones reutilizables en `lib/` para que construyas comandos rápido.

### `lib/isAdmin.js`

```javascript
/**
 * Verifica si un usuario es administrador del grupo.
 * @param {object} sock - Instancia de conexión de Baileys.
 * @param {string} groupJid - JID del grupo.
 * @param {string} userJid - JID del usuario a verificar.
 * @returns {Promise<boolean>}
 */
async function isAdmin(sock, groupJid, userJid) {
  const metadata = await sock.groupMetadata(groupJid);
  const participant = metadata.participants.find(p => p.id === userJid);
  return participant?.admin === "admin" || participant?.admin === "superadmin";
}

module.exports = isAdmin;
```

### `lib/isBanned.js`

```javascript
const db = require("./index");

/**
 * Comprueba si un usuario está baneado.
 * @param {string} userJid
 * @returns {boolean}
 */
function isBanned(userJid) {
  const banned = db.get("banned") || [];
  return banned.includes(userJid);
}

module.exports = isBanned;
```

### `lib/ffmpeg.js`

```javascript
const { spawn } = require("child_process");

/**
 * Convierte un buffer de video a sticker WebP animado.
 * @param {Buffer} input
 * @returns {Promise<Buffer>}
 */
function videoToWebp(input) {
  return new Promise((resolve, reject) => {
    const args = [
      "-i", "pipe:0",
      "-vcodec", "libwebp",
      "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15",
      "-loop", "0",
      "-f", "webp", "pipe:1"
    ];
    const proc = spawn("ffmpeg", args);
    const chunks = [];

    proc.stdout.on("data", chunk => chunks.push(chunk));
    proc.stderr.on("data", () => {});
    proc.on("close", code => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error("FFmpeg falló al convertir el video."));
    });

    proc.stdin.write(input);
    proc.stdin.end();
  });
}

module.exports = { videoToWebp };
```

### `lib/index.js` (base de datos)

```javascript
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/store.json");

function readStore() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeStore(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function get(key) {
  return readStore()[key];
}

function set(key, value) {
  const store = readStore();
  store[key] = value;
  writeStore(store);
}

module.exports = { get, set };
```

---

## 🔌 Guía de desarrollo de plugins

Cada comando es un archivo independiente dentro de `commands/`. El bot los carga de forma automática al iniciar.

### Estructura mínima de un comando

```javascript
module.exports = {
  name: "nombre_del_comando",
  category: "categoria",
  permission: "public",   // "public", "admin" o "owner"
  description: "Qué hace el comando",
  aliases: ["alias1", "alias2"],
  cooldown: 5000,          // milisegundos entre usos por usuario
  async execute(sock, msg, args, context) {
    // Tu lógica aquí
  }
};
```

### Pasos para crear un comando nuevo

1. Crea el archivo en `commands/<categoria>/<nombre>.js`.
2. Define `name`, `category` y `execute`.
3. Usa `context` para acceder a datos del mensaje: `jid`, `sender`, `isGroup`, `mentionedJid`.
4. Reinicia el bot. El cargador detecta el archivo sin configuración extra.
5. Prueba el comando con `.nombre_del_comando` en un chat.

### Buenas prácticas

- Valida siempre los argumentos antes de ejecutar lógica pesada.
- Usa `try/catch` en cualquier llamada a una API externa.
- Limita el tamaño de los archivos que procesas para evitar bloqueos de memoria.
- Registra errores con el logger central, no con `console.log`.

---

## 🗄️ Modelo de datos

El bot guarda su estado en archivos JSON dentro de `data/`.

### `userGroupData.json`

```json
{
  "593999999999-1234567890@g.us": {
    "antilink": true,
    "antibadword": false,
    "welcome": true,
    "welcomeMessage": "Bienvenido {user} a {group}",
    "warnings": {
      "593987654321@s.whatsapp.net": 1
    }
  }
}
```

### `banned.json`

```json
{
  "users": ["593912345678@s.whatsapp.net"],
  "reasons": {
    "593912345678@s.whatsapp.net": "Spam reiterado"
  }
}
```

### `messageCount.json`

```json
{
  "593912345678@s.whatsapp.net": {
    "total": 542,
    "lastMessageAt": "2026-09-01T10:00:00Z"
  }
}
```

---

## 📡 Sistema de eventos

El bot escucha eventos de Baileys y los distribuye a los módulos correspondientes.

| Evento | Disparador | Módulo encargado |
|:---|:---|:---|
| `messages.upsert` | Llega un mensaje nuevo | `main.js` |
| `group-participants.update` | Alguien entra o sale del grupo | `lib/welcome.js` |
| `connection.update` | Cambia el estado de la conexión | `index.js` |
| `creds.update` | Se actualizan las credenciales | `index.js` |

**Ejemplo de manejador (`main.js`):**

```javascript
sock.ev.on("group-participants.update", async (update) => {
  const { id: groupJid, participants, action } = update;
  const settings = db.get("userGroupData")?.[groupJid];

  if (action === "add" && settings?.welcome) {
    for (const participant of participants) {
      const text = settings.welcomeMessage
        .replace("{user}", `@${participant.split("@")[0]}`)
        .replace("{group}", (await sock.groupMetadata(groupJid)).subject);

      await sock.sendMessage(groupJid, { text, mentions: [participant] });
    }
  }
});
```

---

## 🏗️ Arquitectura

```text
Java-Bot-MD
├── commands/              Lógica de cada comando
│   ├── moderation/
│   ├── download/
│   ├── ai/
│   └── sticker/
├── lib/                   Funciones centrales
│   ├── isAdmin.js         Verifica roles de administrador
│   ├── isBanned.js        Gestiona baneos en caché
│   ├── index.js           Base de datos centralizada
│   ├── myfunc.js          Funciones de utilidad
│   ├── exif.js            Inyecta metadatos en stickers
│   ├── ffmpeg.js          Procesa multimedia
│   ├── ytDownload.js      Descarga de YouTube
│   └── lightweight_store.js  Almacena mensajes y contactos
├── data/                  Persistencia en JSON
├── session/               Credenciales de Baileys (privado)
├── temp/                  Archivos temporales
├── assets/                Recursos estáticos
├── test/                  Pruebas automatizadas
├── index.js               Punto de entrada
├── main.js                Manejador de eventos
├── settings.js            Configuración global
└── package.json           Dependencias del proyecto
```

---

## 🛡️ Seguridad

- El bot procesa y guarda los datos en tu propio servidor. No usa almacenamiento externo.
- Baileys cifra las credenciales de sesión (`creds.json`).
- El sistema borra archivos temporales cada 3 horas.
- El código es abierto. Tú puedes auditarlo completo.
- Reporta vulnerabilidades por mensaje privado al mantenedor, no en un issue público.

---

## 🧪 Testing

El proyecto usa [Jest](https://jestjs.io/) para pruebas unitarias.

```bash
npm install --save-dev jest
npm test
```

**Ejemplo de prueba (`test/isAdmin.test.js`):**

```javascript
const isAdmin = require("../lib/isAdmin");

test("detecta a un administrador correctamente", async () => {
  const mockSock = {
    groupMetadata: async () => ({
      participants: [
        { id: "user1@s.whatsapp.net", admin: "admin" },
        { id: "user2@s.whatsapp.net", admin: null }
      ]
    })
  };

  await expect(isAdmin(mockSock, "group@g.us", "user1@s.whatsapp.net")).resolves.toBe(true);
  await expect(isAdmin(mockSock, "group@g.us", "user2@s.whatsapp.net")).resolves.toBe(false);
});
```

---

## ⚡ Rendimiento y escalado

- Usa PM2 en modo cluster solo si separas la sesión de WhatsApp por instancia. Baileys no soporta múltiples procesos sobre la misma sesión.
- Limita el tamaño máximo de descarga a 100 MB para evitar saturar la RAM.
- Programa la limpieza de `temp/` cada 3 horas con un cron interno.
- Usa una base de datos como SQLite o MongoDB si manejas más de 50 grupos activos.

---

## 🐛 Solución de problemas

<details>
<summary><b>El bot no responde a los comandos</b></summary>
<br>
Revisa que el bot tenga permisos de administrador. Si eres el dueño, ejecuta <code>.mode public</code>. Confirma también el prefijo configurado en <code>settings.js</code>.
</details>

<details>
<summary><b>Error "FFmpeg not found" al crear stickers</b></summary>
<br>
Instala FFmpeg con <code>sudo apt install ffmpeg -y</code> en Linux, o vía Chocolatey en Windows.
</details>

<details>
<summary><b>El bot se reinicia constantemente</b></summary>
<br>
Borra la carpeta <code>session/</code>, genera un nuevo pair code y confirma que tu hosting tenga al menos 512 MB de RAM.
</details>

<details>
<summary><b>Error "Cannot find module"</b></summary>
<br>
Ejecuta <code>rm -rf node_modules/ package-lock.json</code> y luego <code>npm install</code>.
</details>

<details>
<summary><b>Las descargas de YouTube fallan</b></summary>
<br>
Actualiza la librería de descarga con <code>npm update ytdl-core</code>. YouTube cambia su API con frecuencia.
</details>

---

## ❓ Preguntas frecuentes

<details>
<summary><b>¿Es seguro usarlo en mi número principal?</b></summary>
<br>
WhatsApp prohíbe los clientes no oficiales. Usa un número secundario para evitar riesgo de baneo.
</details>

<details>
<summary><b>¿Cuántos grupos puede manejar?</b></summary>
<br>
El bot maneja cientos de grupos sin problema. Para uso intensivo, usa un servidor con al menos 1 GB de RAM.
</details>

<details>
<summary><b>¿Puedo añadir mis propios comandos?</b></summary>
<br>
Sí. Crea un archivo en <code>commands/</code>, exporta la función y regístrala según la guía de plugins.
</details>

<details>
<summary><b>¿Puedo conectar una base de datos externa?</b></summary>
<br>
Sí. Reemplaza las funciones de <code>lib/index.js</code> por conectores a MongoDB, PostgreSQL o la base que prefieras. La interfaz <code>get</code> y <code>set</code> se mantiene igual.
</details>

---

## 🤝 Contribuir

1. Haz fork del proyecto.
2. Crea una rama para tu función: `git checkout -b feature/mi-funcion`.
3. Haz commit de tus cambios: `git commit -m 'Añade: mi función'`.
4. Sube la rama: `git push origin feature/mi-funcion`.
5. Abre un pull request y describe qué mejora tu código.

### Estándar de código
- Usa comillas dobles en JavaScript.
- Nombra las funciones en inglés y los comentarios en español.
- Añade una prueba en `test/` para cada función nueva en `lib/`.

---

## 🗺️ Roadmap

- [x] v3.0: moderación completa, descargas multi plataforma, IA integrada.
- [ ] v3.1: sistema de economía y niveles, comandos RPG, base de datos SQLite.
- [ ] v3.2: panel web de administración en tiempo real.
- [ ] v4.0: arquitectura de plugins y API REST para desarrolladores.

---

## 📝 Changelog

### v3.1.0
- Rediseño de la interfaz con tarjetas y botones de acción.
- Mejora del 50% en velocidad de procesamiento de medios.
- Sistema anti-baneo y validación de JID mejorados.
- Corrección de 25 errores reportados por la comunidad.

---

## 🌐 Soporte

| Canal | Enlace | Propósito |
|:---|:---|:---|
| WhatsApp | [Unirse](https://whatsapp.com/channel/0029Va90zAnIHphOuO8Msp3A) | Actualizaciones y versiones beta |
| Telegram | [Unirse](https://t.me/+3QhFUZHx-nhhZmY1) | Soporte técnico |
| YouTube | [Suscribirse](https://youtube.com/@mr_unique_hacker) | Tutoriales de instalación |
| GitHub Issues | [Reportar](https://github.com/JAVIER10733/Java-bot-Md/issues) | Reporte de errores |

---

## 🙏 Créditos

**Desarrollo principal**
- [Professor (JAVIER10733)](https://github.com/JAVIER10733): creador y mantenedor del proyecto.

**Librerías clave**
- [Baileys](https://github.com/WhiskeySockets/Baileys): conexión con WhatsApp.
- [FFmpeg](https://ffmpeg.org/): procesamiento de audio y video.
- [Sharp](https://sharp.pixelplumbing.com/): procesamiento de imágenes.

**Colaboradores**
- [TechGod143](https://github.com/TechGod143) y [Dgxeon](https://github.com/Dgxeon): sistema de pair code.
- [Adiwajshing](https://github.com/adiwajshing): creador original de Baileys.

---

## ⚖️ Licencia

Este proyecto tiene fines educativos. No es un producto oficial de WhatsApp Inc. ni está afiliado a Meta Platforms.

El uso de bots no oficiales puede violar los términos de servicio de WhatsApp. Existe riesgo de baneo de tu número. Úsalo bajo tu propia responsabilidad. El desarrollador no responde por daños derivados del uso del software. Prohibido usar este bot para spam, acoso, fraude o cualquier actividad ilegal.

Este proyecto usa la [Licencia MIT](https://opensource.org/licenses/MIT). Puedes usar, copiar, modificar y distribuir el software si:
1. Incluyes el aviso de copyright original.
2. No lo usas con fines maliciosos o de spam.
3. Reconoces a los autores originales.

---

<div align="center">

[![Repo size](https://img.shields.io/github/repo-size/JAVIER10733/Java-bot-Md?style=for-the-badge&color=informational)](https://github.com/JAVIER10733/Java-bot-Md)
[![Code size](https://img.shields.io/github/languages/code-size/JAVIER10733/Java-bot-Md?style=for-the-badge&color=blue)](https://github.com/JAVIER10733/Java-bot-Md)
[![Top language](https://img.shields.io/github/languages/top/JAVIER10733/Java-bot-Md?style=for-the-badge&color=yellow)](https://github.com/JAVIER10733/Java-bot-Md)
[![Last commit](https://img.shields.io/github/last-commit/JAVIER10733/Java-bot-Md?style=for-the-badge&color=green)](https://github.com/JAVIER10733/Java-bot-Md)

<br>

**Si este proyecto te sirve, deja una estrella en el repositorio.**

Hecho por [Professor (JAVIER10733)](https://github.com/JAVIER10733)

</div>
