import type { IncomingMessage, Server } from 'http'

import { default as WebSocket } from 'ws'

import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../index.js'

import { createLocalReq, getPayload } from '../index.js'

const createLocalReqFromNode = async (
  request: IncomingMessage,
  config: SanitizedConfig,
): Promise<PayloadRequest> => {
  const headers = new Headers()

  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v)
      }
    } else {
      headers.set(key, value)
    }
  }

  const payload = await getPayload({ config })

  const authResult = await payload.auth({ headers })

  return createLocalReq(
    {
      req: {
        headers,
        url: request.url,
      },
      user: authResult.user,
    },
    payload,
  )
}

const availableChannels = ['payload-data']

const setPayloadRequest = (ws: WebSocket, req: PayloadRequest) => {
  ws['payloadReq'] = req
}

const getPayloadRequest = (ws: WebSocket): PayloadRequest => {
  return ws['payloadReq']
}

type SubscribeEvent = {
  data: {
    channel: string
    opts?: Record<string, unknown>
  }
  type: 'subscribe'
}

type UnsubscribeEvent = {
  data: {
    channel: string
  }
  type: 'unsubscribe'
}

type Event = SubscribeEvent | UnsubscribeEvent

const parseEvent = (data: WebSocket.RawData): Event => {
  if (typeof data !== 'string') {
    return null
  }

  let parsedJSON: Event | null = null

  try {
    parsedJSON = JSON.parse(data)
  } catch {
    return null
  }

  if (typeof parsedJSON !== 'object' || parsedJSON === null) {
    return null
  }

  return parsedJSON
}

export const attachWebsocket = async ({
  config,
  debug,
  server,
}: {
  config: SanitizedConfig
  debug?: boolean
  server: Server
}) => {
  const payload = await getPayload({ config })
  const wss = new WebSocket.Server({ noServer: true })

  // await payload.pubSub.subscribe('payload', (message) => {})

  wss.on('connection', (ws) => {
    const { payload } = getPayloadRequest(ws)

    let channels: string[] = []

    ws.on('message', (message) => {
      const event = parseEvent(message)

      if (!event) {
        return
      }

      if (debug) {
        payload.logger.debug('Received event', event)
      }

      if (event.type == 'subscribe') {
        if (availableChannels.includes(event.data.channel)) {
          channels.push(event.data.channel)
        }
      } else if (event.type === 'unsubscribe') {
        channels = channels.filter((channel) => channel !== event.data.channel)
      }
    })
  })

  server.on('upgrade', async (request, socket, head) => {
    const req = await createLocalReqFromNode(request, config)

    if (req.pathname.startsWith('/api/realtime')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        setPayloadRequest(ws, req)
        wss.emit('connection', ws, request)
      })
    }
  })
}
