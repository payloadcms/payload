import type { Server } from 'http'
import type WebSocketType from 'ws'

import { createRequire } from 'module'
import { parse } from 'url'

import type { SanitizedConfig } from '../config/types.js'

import { getPayload } from '../index.js'

const require = createRequire(import.meta.url)

const WebSocket = require('ws') as typeof WebSocketType

export const bindWebsocketToServer = async ({
  config,
  server,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  server: Server
}) => {
  const wss = new WebSocket.Server({ noServer: true })

  const payload = await getPayload({ config })

  wss.on('connection', (ws) => {
    console.log('incoming connection', ws)
    ws.onclose = () => {
      console.log('connection closed', wss.clients.size)
    }
  })

  server.on('upgrade', function (req, socket, head) {
    const { pathname } = parse(req.url, true)
    if (pathname !== '/_next/webpack-hmr') {
      wss.handleUpgrade(req, socket, head, function done(ws) {
        wss.emit('connection', ws, req)
      })
    }
  })

  payload.logger.info(`Bound WSS`)
}
