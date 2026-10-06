import type { Duplex } from 'node:stream'

import { createHash } from 'node:crypto'
import { createServer } from 'node:http'

/** Hold the HTTP upgrade so config changes can precede HMR listener readiness. */
export async function createHeldWebSocket() {
  const server = createServer()
  const sockets = new Set<Duplex>()
  const pendingUpgrades = new Map<Duplex, string>()
  let hasReleased = false

  const accept = ({ key, socket }: { key: string; socket: Duplex }) => {
    const acceptKey = createHash('sha1')
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64')

    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '',
        '',
      ].join('\r\n'),
    )
  }

  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.on('close', () => {
      sockets.delete(socket)
      pendingUpgrades.delete(socket)
    })
  })
  server.on('upgrade', (request, socket) => {
    const key = request.headers['sec-websocket-key']!

    if (hasReleased) {
      accept({ key, socket })
    } else {
      pendingUpgrades.set(socket, key)
    }
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()

  if (!address || typeof address === 'string') {
    throw new Error('Could not determine the held WebSocket port')
  }

  return {
    getConnectionCount: () => pendingUpgrades.size,
    release: () => {
      hasReleased = true
      for (const [socket, key] of pendingUpgrades) {
        accept({ key, socket })
      }
      pendingUpgrades.clear()
    },
    stop: async () => {
      for (const socket of sockets) {
        socket.destroy()
      }
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      )
    },
    url: `ws://127.0.0.1:${address.port}`,
  }
}
