<div align="center">

# DVYER WA CORE

### API de WhatsApp Multi-Device personalizada por **dvyer**

<p>
  <img alt="Node" src="https://img.shields.io/badge/Node-20%2B-1f6f43?style=for-the-badge" />
  <img alt="Runtime" src="https://img.shields.io/badge/Runtime-CommonJS-16324f?style=for-the-badge" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-c33c54?style=for-the-badge" />
</p>

</div>

---

## Vista General

Este proyecto es una base para bots de WhatsApp enfocada en:

- Conexion estable por WebSocket (multi-device).
- Manejo de eventos en tiempo real.
- Envio y recepcion de mensajes, media y acciones de grupos.
- Personalizacion de login por **pairing code**.

## Identidad del Proyecto

- Creador: **dvyer**
- Paquete: **`@dvyer/baileys`**
- Repositorio: **`https://github.com/dvyer/Baileys`**

## Instalacion

```bash
yarn add @dvyer/baileys
```

O desde GitHub:

```bash
yarn add github:dvyer/Baileys
```

## Inicio Rapido

```js
const makeWASocket = require('@dvyer/baileys').default
const { useMultiFileAuthState } = require('@dvyer/baileys')

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_dvyer')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const msg = messages[0]
    const text = msg?.message?.conversation || ''

    if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(msg.key.remoteJid, { text: 'pong - dvyer core' })
    }
  })
}

startBot()
```

## Modo Estable (Auto-Reconexion)

```js
const {
  makeWASocketWithReconnect,
  useMultiFileAuthState
} = require('@dvyer/baileys')

async function startStableBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_dvyer')

  const supervisor = makeWASocketWithReconnect(
    {
      auth: state,
      printQRInTerminal: true
    },
    {
      maxRetries: Infinity,
      initialDelayMs: 1500,
      maxDelayMs: 30000
    }
  )

  supervisor.ev.on('socket.created', ({ socket }) => {
    socket.ev.on('creds.update', saveCreds)
  })
}
```

## Guardias Globales de Errores

```js
const { installGlobalProcessGuards } = require('@dvyer/baileys')

installGlobalProcessGuards({
  logger: console,
  exitOnException: false
})
```

## Pairing Code (Verificacion)

Este fork viene configurado para usar por defecto el codigo:

```text
DVYER123
```

Si quieres forzarlo manualmente al conectar:

```js
const code = await sock.requestPairingCode('51999999999', 'DVYER123')
console.log('Pairing code:', code)
```

Si llamas `requestPairingCode(numero)` sin segundo parametro, tambien se usa `DVYER123` por defecto.

## Flujo Recomendado de Autenticacion

1. Generar estado con `useMultiFileAuthState`.
2. Escuchar `creds.update` y guardar cambios siempre.
3. Conectar por QR o pairing.
4. Reutilizar el estado persistente para no reloguear cada reinicio.

## Ejemplo Basico de Envio

```js
await sock.sendMessage('51999999999@s.whatsapp.net', {
  text: 'Hola, bot activo con identidad dvyer.'
})
```

## Buenas Practicas

- Usa Node.js 20 o superior.
- Guarda credenciales fuera de repositorios publicos.
- No hardcodees secretos adicionales en el codigo.
- Maneja reconexion en `connection.update`.

## Estructura del Proyecto

```text
lib/
  Defaults/
  Signal/
  Socket/
  Store/
  Types/
  Utils/
WAProto/
README.md
package.json
```

## Estado

Este repositorio mantiene una linea personalizada visual y funcional para despliegues propios de bots.

## Licencia

MIT © dvyer

---

<div align="center">
Hecho para automatizacion real, estable y personalizable.
</div>
