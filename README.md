
<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&pause=1000&color=00FF88&center=true&vCenter=true&width=900&lines=JAVA+BOT+MD;Multi-Device+WhatsApp+Bot;Desarrollado+por+Professor;Edici%C3%B3n+Profesional+2026" alt="Typing SVG" />
  <br><br>
  
  <!-- Badges de Estado y Tecnología -->
  <img src="https://img.shields.io/badge/Node.js-18.x+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/WhatsApp-Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp">
  <img src="https://img.shields.io/badge/FFmpeg-Media%20Processing-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Status-Activo-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Versi%C3%B3n-3.1.0-blue?style=for-the-badge" alt="Version">
  
  <br><br>
  
  <!-- Imagen Principal del Bot (URL RAW para renderizado correcto en GitHub) -->
  <img src="https://raw.githubusercontent.com/JAVIER10733/Java-bot-Md/main/assets/bot_image.jpg" alt="Java Bot MD Banner" width="650" style="border-radius: 20px; box-shadow: 0 10px 40px rgba(0,255,136,0.4); border: 3px solid #00FF88;">
  
  <br><br>
  <a href="https://github.com/JAVIER10733/Java-bot-Md/stargazers">
    <img src="https://img.shields.io/github/stars/JAVIER10733/Java-bot-Md?style=for-the-badge&color=yellow" alt="Stars">
  </a>
  <a href="https://github.com/JAVIER10733/Java-bot-Md/network/members">
    <img src="https://img.shields.io/github/forks/JAVIER10733/Java-bot-Md?style=for-the-badge&color=blue" alt="Forks">
  </a>
  <a href="https://github.com/JAVIER10733/Java-bot-Md/issues">
    <img src="https://img.shields.io/github/issues/JAVIER10733/Java-bot-Md?style=for-the-badge&color=red" alt="Issues">
  </a>
</div>

---

## 📑 Tabla de Contenidos

<details open>
<summary><b>📂 Haz clic para expandir la navegación completa</b></summary>

1. [🌟 Introducción](#-introducción)
2. [💻 Stack Tecnológico](#-stack-tecnológico)
3. [✨ Características de Nivel Empresarial](#-características-de-nivel-empresarial)
4. [🚀 Despliegue Rápido (Deploy)](#-despliegue-rápido-deploy)
5. [⚙️ Instalación Local Detallada](#️-instalación-local-detallada)
6. [🔐 Configuración y Variables de Entorno](#-configuración-y-variables-de-entorno)
7. [📜 Lista Maestra de Comandos](#-lista-maestra-de-comandos)
8. [🏗️ Arquitectura del Proyecto](#️-arquitectura-del-proyecto)
9. [🛡️ Seguridad y Privacidad](#️-seguridad-y-privacidad)
10. [🐛 Solución de Problemas (Troubleshooting)](#-solución-de-problemas-troubleshooting)
11. [❓ Preguntas Frecuentes (FAQ)](#-preguntas-frecuentes-faq)
12. [🤝 Guía de Contribución](#-guía-de-contribución)
13. [🗺️ Roadmap del Proyecto](#️-roadmap-del-proyecto)
14. [📝 Changelog](#-changelog)
15. [🌐 Comunidad y Soporte Premium](#-comunidad-y-soporte-premium)
16. [🙏 Créditos y Agradecimientos](#-créditos-y-agradecimientos)
17. [⚖️ Aviso Legal y Licencia](#️-aviso-legal-y-licencia)

</details>

---

## 🌟 Introducción

**Java Bot MD** es un sistema de automatización de WhatsApp Multi-Dispositivo de código abierto, desarrollado con la librería [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys). Diseñado desde cero para ser **rápido, estable, seguro y altamente personalizable**, ofrece herramientas avanzadas de moderación, descarga de multimedia, inteligencia artificial y gestión de comunidades.

> [!IMPORTANT]
> Este bot requiere **Node.js v18+** y **FFmpeg** instalado en el sistema para el procesamiento correcto de stickers, audio y video. No almacena datos sensibles en servidores externos.

---

## 💻 Stack Tecnológico

El bot está construido sobre tecnologías robustas y ampliamente utilizadas en la industria:

| Tecnología | Propósito | Versión Mínima |
|:---|:---|:---|
| **[Node.js](https://nodejs.org/)** | Entorno de ejecución del servidor | `18.x` |
| **[Baileys](https://github.com/WhiskeySockets/Baileys)** | Protocolo de conexión con WhatsApp Web | `Latest` |
| **[FFmpeg](https://ffmpeg.org/)** | Procesamiento y conversión de multimedia | `5.x+` |
| **[Sharp](https://sharp.pixelplumbing.com/)** | Manipulación y optimización de imágenes | `0.32.x` |
| **[Axios](https://axios-http.com/)** | Cliente HTTP para peticiones a APIs | `1.x` |
| **[Node-ID3](https://github.com/Zazama/node-id3)** | Inyección de metadatos en archivos de audio | `Latest` |

---

## ✨ Características de Nivel Empresarial

### 🛡️ Sistema de Moderación Inteligente
- **Anti-Link**: Detección y eliminación automática de enlaces no autorizados con registro de infracciones.
- **Anti-Badword**: Filtro de lenguaje ofensivo con 3 niveles de sanción configurables (borrar, advertir, expulsar).
- **Anti-Tag**: Prevención de spam mediante menciones masivas no autorizadas.
- **Welcome/Goodbye**: Mensajes de bienvenida y despedida totalmente personalizables con variables dinámicas (`{user}`, `{group}`).

### 📥 Descarga de Multimedia de Alta Calidad
- **YouTube**: Descarga de audio (MP3 con metadatos ID3) y video (MP4) en máxima resolución.
- **TikTok**: Extracción de videos sin marca de agua y con metadatos originales.
- **Instagram**: Soporte para Reels, Posts, Stories e IGTV.
- **Facebook & Spotify**: Descarga directa con información de la pista.

### 🤖 Inteligencia Artificial Integrada
- **ChatGPT / Blackbox**: Respuestas contextuales con memoria de conversación.
- **Generación de Imágenes**: Creación de arte con IA (DALL-E, Flux).
- **Text-to-Video**: Generación de clips cortos basados en prompts de texto.

### 🎨 Estudio de Creación de Contenido
- **Stickers**: Conversión instantánea de imágenes, videos y GIFs a formato WebP optimizado.
- **Text Effects**: 18+ efectos de texto profesionales (neón, hielo, fuego, metálico).
- **Photo Editor**: Blur, removebg (fondo transparente), remini (mejora de calidad) y emojimix.

---

## 🚀 Despliegue Rápido (Deploy)

Sigue estos 3 sencillos pasos para tener tu bot funcionando en la nube en menos de 5 minutos.

### Paso 1: Haz Fork al Repositorio
Copia el código fuente a tu propia cuenta de GitHub para poder modificarlo y mantenerlo actualizado.
<div align="center">
  <a href="https://github.com/JAVIER10733/Java-bot-Md/fork">
    <img src="https://img.shields.io/badge/🍴_Hacer_Fork-Aquí-181717?style=for-the-badge&logo=github&logoColor=white" alt="Fork Repository"/>
  </a>
</div>

### Paso 2: Obtén el Código de Vinculación (Pair Code)
Vincula tu número de WhatsApp sin necesidad de escanear un código QR complejo.
<div align="center">
  <a href="https://knight-bot-paircode.onrender.com" target="_blank">
    <img src="https://img.shields.io/badge/🔑_Obtener_Pair_Code-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Get Pair Code"/>
  </a>
</div>
> *Nota: Después de obtener el archivo `creds.json`, súbelo a la carpeta `session/` de tu repositorio o panel de hosting.*

### Paso 3: Despliega en tu Plataforma Favorita
<div align="center">

| Plataforma | Tipo | Enlace |
|:---|:---|:---|
| 📺 **Tutorial en Video** | Guía paso a paso | [![YouTube](https://img.shields.io/badge/Ver_Tutorial-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/-oz_u1iMgf8) |
| 🖥️ **Bot Hosting Panel** | Panel gratuito/fácil | [![Panel](https://img.shields.io/badge/Deploy_Panel-28a745?style=for-the-badge&logo=server&logoColor=white)](https://bot-hosting.net/?aff=1068419752923508776) |
| ☁️ **Petrosky VPS** | Servidor privado potente | [![VPS](https://img.shields.io/badge/VPS_Petrosky-0078E7?style=for-the-badge&logo=linux&logoColor=white)](https://client.petrosky.io/aff.php?aff=394) |
| 📊 **Katabump Panel** | Panel alternativo | [![Katabump](https://img.shields.io/badge/Katabump-D6B7D6?style=for-the-badge&logo=server&logoColor=black)](https://dashboard.katabump.com/auth/login#d6b7d6) |

</div>

---

## ⚙️ Instalación Local Detallada

### Requisitos Previos
```bash
✅ Node.js v18.x o superior
✅ Git (para clonar el repositorio)
✅ FFmpeg (para procesamiento de multimedia)
✅ NPM o Yarn (gestor de paquetes)
```

### Instalación en Linux / Ubuntu (Recomendado)
```bash
# 1. Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar Git y FFmpeg
sudo apt install git ffmpeg -y

# 4. Clonar tu repositorio (reemplaza con tu URL)
git clone https://github.com/JAVIER10733/Java-bot-Md.git
cd Java-bot-Md

# 5. Instalar dependencias
npm install

# 6. Iniciar el bot
node index.js

# 7. (Opcional) Ejecutar en segundo plano con PM2
npm install -g pm2
pm2 start index.js --name "java-bot"
pm2 save
pm2 startup
```

### Instalación con Docker (Avanzado)
```bash
# 1. Clonar el repositorio
git clone https://github.com/JAVIER10733/Java-bot-Md.git
cd Java-bot-Md

# 2. Construir la imagen Docker
docker build -t java-bot-md .

# 3. Ejecutar el contenedor con volúmenes persistentes
docker run -d \
  --name java-bot \
  --restart unless-stopped \
  -v ./session:/app/session \
  -v ./data:/app/data \
  java-bot-md

# 4. Ver logs en tiempo real
docker logs -f java-bot
```

---

## 🔐 Configuración y Variables de Entorno

### Archivo `settings.js`
Configura las variables principales del bot para personalizar su identidad:

```javascript
global.botName = "Java Bot MD";                    // Nombre visible del bot
global.ownerNumber = "593999999999";                // Tu número (con código de país, sin +)
global.packname = "Java Bot MD";                   // Nombre del paquete de stickers
global.author = "Professor";                       // Autor de los stickers
global.channelLink = "https://whatsapp.com/channel/..."; // Enlace de tu canal oficial
global.prefix = ".";                               // Prefijo de comandos
global.mode = "public";                            // 'public' (todos) o 'private' (solo owner)
```

### Variables de Entorno (`.env`)
Para entornos de producción, crea un archivo `.env` en la raíz:
```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
MAX_RAM_MB=512
NODE_ENV=production
DEBUG=false
```

---

## 📜 Lista Maestra de Comandos

> [!TIP]
> Todos los comandos utilizan el prefijo `.` (punto). Ejemplo: `.help`

### 🛡️ Moderación de Grupos
| Comando | Descripción | Permisos |
|:---|:---|:---|
| `.tagall` | Etiqueta a todos los miembros del grupo | Admin |
| `.tagnotadmin` | Etiqueta solo a los miembros que no son admin | Admin |
| `.hidetag` | Etiqueta a todos sin mostrar el símbolo `@` | Admin |
| `.kick` | Expulsa a un usuario del grupo | Admin |
| `.promote` / `.demote` | Ascender o degradar a un usuario | Admin |
| `.mute` / `.unmute` | Silenciar o activar el grupo | Admin |
| `.antilink on/off` | Activar/desactivar protección contra enlaces | Admin |
| `.antibadword on/off` | Activar/desactivar filtro de palabras ofensivas | Admin |
| `.welcome` / `.goodbye` | Configurar mensajes de entrada/salida | Admin |

### 📥 Descarga de Multimedia
| Comando | Descripción | Ejemplo de Uso |
|:---|:---|:---|
| `.play` | Descarga audio de YouTube | `.play bad bunny monaco` |
| `.video` | Descarga video de YouTube | `.video tutorial nodejs` |
| `.tiktok` | Descarga video de TikTok sin marca | `.tiktok https://...` |
| `.instagram` | Descarga posts/reels de Instagram | `.ig https://...` |
| `.spotify` | Busca y descarga canción de Spotify | `.spotify shape of you` |

### 🤖 Inteligencia Artificial
| Comando | Descripción | Ejemplo de Uso |
|:---|:---|:---|
| `.ia` / `.gpt` | Pregunta a la inteligencia artificial | `.ia ¿Qué es Node.js?` |
| `.imagine` | Genera imágenes con IA | `.imagine un gato astronauta` |
| `.sora` | Genera videos cortos con IA | `.sora un perro corriendo` |

### 🎨 Creación de Stickers
| Comando | Descripción | Uso |
|:---|:---|:---|
| `.sticker` / `.s` | Convierte imagen/video a sticker | Responder a medio + `.s` |
| `.take` | Cambia el paquete y autor de un sticker | `.take Mi Paquete` |
| `.toimg` / `.simage` | Convierte sticker no animado a imagen | Responder a sticker + `.toimg` |
| `.tg` | Descarga paquete de stickers de Telegram | `.tg https://t.me/...` |

### 🛠️ Utilidades y Propietario
| Comando | Descripción | Permisos |
|:---|:---|:---|
| `.translate` | Traduce texto a cualquier idioma | Todos |
| `.ss` | Captura de pantalla de sitio web | Todos |
| `.ping` | Verifica la velocidad de respuesta del bot | Todos |
| `.mode` | Cambia entre modo público y privado | Owner |
| `.sudo add/del` | Gestiona usuarios con privilegios de dueño | Owner |
| `.cleartmp` | Limpia archivos temporales del servidor | Owner |

---

## 🏗️ Arquitectura del Proyecto

```text
📦 Java-Bot-MD
 ┣ 📂 commands/              # Lógica de cada comando individual (.js)
 ┣ 📂 lib/                   # Funciones centrales reutilizables
 ┃ ┣ 📜 isAdmin.js           # Verificación de roles de administrador
 ┃ ┣ 📜 isBanned.js          # Sistema de baneos con caché en memoria
 ┃ ┣ 📜 index.js             # Base de datos centralizada (JSON)
 ┃ ┣ 📜 myfunc.js            # Funciones de utilidad y formato
 ┃ ┣ 📜 exif.js              # Inyección de metadatos en stickers
 ┃ ┣ 📜 ffmpeg.js            # Procesamiento de multimedia
 ┃ ┗ 📜 lightweight_store.js # Almacén ligero de mensajes y contactos
 ┣ 📂 data/                  # Persistencia de datos (JSON)
 ┃ ┣ 📜 userGroupData.json   # Configuraciones de grupos y usuarios
 ┃ ┣ 📜 banned.json          # Lista de usuarios baneados
 ┃ ┗ 📜 messageCount.json    # Contador de mensajes para rankings
 ┣ 📂 session/               # Credenciales de Baileys (⚠️ NO COMPARTIR)
 ┣ 📂 temp/                  # Archivos temporales (auto-limpieza cada 3h)
 ┣ 📂 assets/                # Recursos estáticos (imágenes, stickers)
 ┣ 📜 index.js               # Punto de entrada principal del bot
 ┣ 📜 main.js                # Manejador de mensajes y eventos
 ┣ 📜 settings.js            # Configuración global del bot
 ┗ 📜 package.json           # Dependencias y scripts del proyecto
```

---

## 🛡️ Seguridad y Privacidad

> [!NOTE]
> **Java Bot MD** prioriza la seguridad de tus datos:
> 1. **Sin Almacenamiento Externo**: Los mensajes y credenciales se procesan y almacenan localmente en tu servidor.
> 2. **Cifrado de Sesión**: Las credenciales de WhatsApp (`creds.json`) están cifradas por la librería Baileys.
> 3. **Limpieza Automática**: El sistema elimina archivos temporales cada 3 horas para prevenir fugas de espacio en disco.
> 4. **Código Abierto**: Puedes auditar el 100% del código fuente para verificar que no hay prácticas maliciosas.

---

## 🐛 Solución de Problemas (Troubleshooting)

<details>
<summary>❌ <b>El bot no responde a los comandos</b></summary>
<br>
<strong>Causas:</strong> El bot no es admin, el modo es 'private', o el prefijo es incorrecto.<br>
<strong>Solución:</strong> Verifica que el bot tenga permisos de administrador. Si eres el dueño, ejecuta <code>.mode public</code>.
</details>

<details>
<summary>❌ <b>Error "FFmpeg not found" al crear stickers</b></summary>
<br>
<strong>Causa:</strong> FFmpeg no está instalado en el sistema operativo.<br>
<strong>Solución:</strong> Ejecuta <code>sudo apt install ffmpeg -y</code> (Linux) o instálalo vía Chocolatey (Windows).
</details>

<details>
<summary>🔄 <b>El bot se reinicia constantemente</b></summary>
<br>
<strong>Causa:</strong> Archivo de sesión corrupto o falta de memoria RAM.<br>
<strong>Solución:</strong> Elimina la carpeta <code>session/</code>, vuelve a generar el Pair Code y asegúrate de que tu hosting tenga al menos 512MB de RAM.
</details>

<details>
<summary>❌ <b>Error "Cannot find module"</b></summary>
<br>
<strong>Causa:</strong> Dependencias incompletas o corruptas.<br>
<strong>Solución:</strong> Ejecuta: <code>rm -rf node_modules/ package-lock.json</code> y luego <code>npm install</code>.
</details>

---

## ❓ Preguntas Frecuentes (FAQ)

<details>
<summary><b>¿Es seguro usar este bot en mi número principal?</b></summary>
Aunque el bot está optimizado para simular comportamiento humano y reducir riesgos, WhatsApp prohíbe el uso de clientes no oficiales. Recomendamos encarecidamente usar un <strong>número secundario</strong> para evitar cualquier riesgo de baneo.
</details>

<details>
<summary><b>¿Cuántos grupos puede manejar simultáneamente?</b></summary>
El bot puede manejar cientos de grupos sin problemas, siempre que el servidor tenga recursos suficientes (mínimo 1GB de RAM recomendado para uso intensivo).
</details>

<details>
<summary><b>¿Puedo añadir mis propios comandos?</b></summary>
¡Sí! El bot es 100% modular. Simplemente crea un archivo `.js` en la carpeta `commands/`, exporta la función y regístrala en `main.js`.
</details>

---

## 🤝 Guía de Contribución

¡Las contribuciones hacen que la comunidad de código abierto sea un lugar increíble para aprender, inspirar y crear! 

1. Haz un **Fork** del proyecto.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/IncreibleFuncion`).
3. Realiza tus cambios y haz commit (`git commit -m '✨ Añade: IncreibleFuncion'`).
4. Sube los cambios a tu rama (`git push origin feature/IncreibleFuncion`).
5. Abre un **Pull Request** detallando qué mejora aporta tu código.

---

## 🗺️ Roadmap del Proyecto

- [x] **v3.0**: Sistema de moderación completo, descargas multi-plataforma, IA integrada.
- [ ] **v3.1**: Sistema de economía y niveles, comandos RPG, base de datos SQLite.
- [ ] **v3.2**: Panel web de administración en tiempo real (Dashboard).
- [ ] **v4.0**: Arquitectura basada en plugins y API REST para desarrolladores.

---

## 📝 Changelog

### v3.1.0 (Actual)
- 🎨 Rediseño completo de la interfaz con tarjetas premium y botones CTA.
- 🚀 Optimización de rendimiento (50% más rápido en procesamiento de medios).
- 🛡️ Sistema anti-baneo y validación de JID mejorado.
- 🐛 Corrección de 25+ bugs reportados por la comunidad.

---

## 🌐 Comunidad y Soporte Premium

¿Necesitas ayuda, quieres reportar un error o sugerir una nueva función? ¡Únete a nuestras comunidades oficiales!

<div align="center">

| Plataforma | Enlace | Propósito |
|:---|:---|:---|
| 📢 **Canal de WhatsApp** | [Unirse](https://whatsapp.com/channel/0029VbDr7ai0bIdqssoHWJ0z) | Actualizaciones, noticias y versiones beta |
| 🐛 **Reportar Bugs** | [GitHub Issues](https://github.com/JAVIER10733/Java-bot-Md/issues) | Reporte formal de errores y solicitudes |

</div>

---

## 🙏 Créditos y Agradecimientos

### 👨‍💻 Desarrollo Principal
- **[Professor (JAVIER10733)](https://github.com/JAVIER10733)** - Creador, arquitecto principal y mantenedor del proyecto.

### 📚 Librerías y Dependencias Clave
- **[Baileys](https://github.com/WhiskeySockets/Baileys)** - Librería base de conexión con WhatsApp.
- **[FFmpeg](https://ffmpeg.org/)** - Motor de procesamiento de audio y video.
- **[Sharp](https://sharp.pixelplumbing.com/)** - Procesamiento de imágenes de alto rendimiento.

### 🤝 Colaboradores e Inspiración
- **[TechGod143](https://github.com/TechGod143)** & **[Dgxeon](https://github.com/Dgxeon)** - Implementación y optimización del sistema de Pair Code.
- **[Adiwajshing](https://github.com/adiwajshing)** - Creador original de la librería Baileys.

---

## ⚖️ Aviso Legal y Licencia

> [!WARNING]
> **IMPORTANTE: Lee esto antes de usar el bot**
> 
> - Este proyecto es **exclusivamente con fines educativos** y de aprendizaje.
> - **NO** es un producto oficial de WhatsApp Inc. ni está afiliado a Meta Platforms.
> - El uso de bots no oficiales **puede violar los Términos de Servicio de WhatsApp**.
> - Existe un **riesgo inherente de baneo** de tu número de WhatsApp. Úsalo bajo tu propia responsabilidad.
> - El desarrollador **NO se hace responsable** por cualquier consecuencia, baneo o daño derivado del uso de este software.
> - **PROHIBIDO** usar este bot para spam, acoso, fraude, phishing o cualquier actividad ilegal.

### 📜 Licencia MIT
Este proyecto está protegido bajo la [Licencia MIT](https://opensource.org/licenses/MIT). Esto significa que puedes usar, copiar, modificar y distribuir el software, siempre y cuando:
1. Incluyas el aviso de copyright original.
2. No utilices el software para fines maliciosos o de spam.
3. Reconozcas a los autores originales.

---

## 📊 Estadísticas de GitHub

<div align="center">

[![GitHub repo size](https://img.shields.io/github/repo-size/JAVIER10733/Java-bot-Md?style=for-the-badge&color=informational)](https://github.com/JAVIER10733/Java-bot-Md)
[![GitHub code size](https://img.shields.io/github/languages/code-size/JAVIER10733/Java-bot-Md?style=for-the-badge&color=blue)](https://github.com/JAVIER10733/Java-bot-Md)
[![GitHub top language](https://img.shields.io/github/languages/top/JAVIER10733/Java-bot-Md?style=for-the-badge&color=yellow)](https://github.com/JAVIER10733/Java-bot-Md)
[![GitHub last commit](https://img.shields.io/github/last-commit/JAVIER10733/Java-bot-Md?style=for-the-badge&color=green)](https://github.com/JAVIER10733/Java-bot-Md)

<br>

![Profile Views](https://komarev.com/ghpvc/?username=JAVIER10733&label=Vistas+del+Perfil&color=00FF88&style=for-the-badge)

</div>

---

<div align="center">

### ⭐ ¡Si este proyecto te ha sido útil, no olvides dejar una estrella (Star) en el repositorio! ⭐

**Hecho con ❤️ y mucho ☕ por [Professor (JAVIER10733)](https://github.com/JAVIER10733)**

<br>

<img src="https://www.pinterest.com/pin/2181499816157853/" alt="Footer SVG" />

</div>
