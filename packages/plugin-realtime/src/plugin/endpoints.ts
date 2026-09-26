import type { Endpoint, Payload } from 'payload'

import type { ReadOperation } from '../plugin/index.js'
import type { QuerySubscription, StringifiedQuery } from './index.js'

type Client = {
  clientId: string
  response: Response
  writer: WritableStreamDefaultWriter
}

export const querySubscriptions = new Map<StringifiedQuery, QuerySubscription>()
export const clients = new Map<string, Client>()

export const payloadQueryEndpoint: Endpoint = {
  handler: async (req) => {
    try {
      if (!req.json) {
        return new Response('req.json is not a function', { status: 500 })
      }
      const body = await req.json()
      const { type, clientId, queryParams } = body as {
        clientId: string
        queryParams: Parameters<Payload[ReadOperation]>[0]
        type: ReadOperation
      }

      if (!type || !queryParams || !clientId) {
        throw new Error('Missing required parameters')
      }
      if (!clients.has(clientId)) {
        throw new Error('Client not found')
      }

      // Execute the initial query
      let result
      if (type === 'count') {
        result = await req.payload.count(queryParams)
      } else if (type === 'find') {
        result = await req.payload.find(queryParams)
      } else if (type === 'findByID') {
        result = await req.payload.findByID(queryParams as Parameters<Payload['findByID']>[0])
      } else {
        throw new Error(`Unsupported query type: ${type}`)
      }

      // Insert or update the querySubscription (depending if queryId already exists)
      const stringifiedQuery = JSON.stringify({ type, queryParams })
      if (!querySubscriptions.has(stringifiedQuery)) {
        querySubscriptions.set(stringifiedQuery, {
          type,
          clients: new Set(),
          queryParams,
        })
      }

      // Add this client to the querySubscription
      const querySubscription = querySubscriptions.get(stringifiedQuery)!
      querySubscription.clients.add(clientId)

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      })
    }
  },
  method: 'post',
  path: '/payload-query',
}

export const payloadSSEEndpoint: Endpoint = {
  handler: (req) => {
    try {
      const stream = new TransformStream()
      const writer = stream.writable.getWriter()
      const response = new Response(stream.readable, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Content-Type': 'text/event-stream',
        },
      })
      if (!req.url) {
        throw new Error('Missing required parameters')
      }
      const url = new URL(req.url)
      const clientId = url.searchParams.get('clientId')
      if (!clientId) {
        throw new Error('Missing required parameters')
      }

      // Send initial heartbeat with clientId
      // await writer.write(new TextEncoder().encode(`data: ${JSON.stringify({ clientId })}\n\n`))

      // Store client connection
      const client = { clientId, response, writer }
      clients.set(clientId, client)

      // Clean up when client disconnects
      req.signal?.addEventListener('abort', () => {
        // Remove this client from all querySubscriptions
        for (const querySubscription of querySubscriptions.values()) {
          querySubscription.clients.delete(clientId)
        }
        clients.delete(clientId)
        writer.close().catch(console.error)
      })

      return response
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error(error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      })
    }
  },
  method: 'get',
  path: '/payload-sse',
}
