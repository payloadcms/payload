/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

import {
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type Config,
  type Endpoint,
  type Payload,
} from 'payload'

import type { ReadOperation } from './usePayloadQuery.js'

export { usePayloadQuery } from './usePayloadQuery.js'
export { createPayloadClient, payloadQuery } from './vanilla/payloadQuery.js'

// TODO: review PayloadQueryRequestBody, Client, QuerySubscription and subscriptions
type PayloadQueryRequestBody =
  | { query: Parameters<Payload['count']>[0]; type: 'count' }
  | { query: Parameters<Payload['find']>[0]; type: 'find' }
  | { query: Parameters<Payload['findByID']>[0]; type: 'findByID' }

type Client = {
  clientId: string
  response: Response
  writer: WritableStreamDefaultWriter<any>
}

type QuerySubscription = {
  clients: Set<Client>
  query: any
  type: 'count' | 'find' | 'findByID'
}

const subscriptions = new Map<string, QuerySubscription>()
const clients = new Set<Client>()

const sendToClients = async (subscription: QuerySubscription, payload: Payload) => {
  const { type, query } = subscription
  let result: Awaited<ReturnType<Payload[ReadOperation]>> | undefined

  if (type === 'count') {
    result = await payload.count(query)
  } else if (type === 'find') {
    result = await payload.find(query)
  } else if (type === 'findByID') {
    result = await payload.findByID(query)
  } else {
    throw new Error('Invalid query type')
  }

  try {
    // TODO: is this correct?
    await Promise.all(
      Array.from(subscription.clients).map(async ({ writer }) => {
        await writer.write(new TextEncoder().encode(`data: ${JSON.stringify(result)}\n\n`))
      }),
    )
  } catch (error) {
    console.error('Error in Promise.all:', error)
  }
  console.log('sendToClients done', result)
}

export const realtimePlugin =
  () =>
  (config: Config): Config => {
    const myAfterChangeHook: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
      console.log('afterChange triggered for collection:', collection.slug, 'doc:', doc.id)
      for (const [key, subscription] of subscriptions) {
        console.log('checking subscription:', key, subscription.type, subscription.query)
        if (subscription.type === 'count') {
          // Always refresh count queries for the affected collection
          if (subscription.query.collection === collection.slug) {
            await sendToClients(subscription, req.payload)
          }
        } else if (subscription.type === 'find') {
          // Refresh find queries if the collection matches
          if (subscription.query.collection === collection.slug) {
            await sendToClients(subscription, req.payload)
          }
        } else if (subscription.type === 'findByID') {
          // Refresh findByID queries if the specific document changed
          if (
            subscription.query.collection === collection.slug &&
            subscription.query.id === doc.id
          ) {
            await sendToClients(subscription, req.payload)
          }
        }
      }
    }

    const myAfterDeleteHook: CollectionAfterDeleteHook = (_args) => {
      // If the collection that changed has a registered reactive count, we have to trigger all its count listeners
      // If the collection that changed has a registered find and satisfies the where of the options, we have to trigger all its find listeners
      // If the document that changed has findById registered, we have to trigger all its find listeners (set to null)
      console.log('myAfterDeleteHook')
    }

    const payloadQueryEndpoint: Endpoint = {
      handler: async (req) => {
        try {
          if (typeof req.json !== 'function') {
            return new Response('req.json is not a function', { status: 500 })
          }
          const { type, clientId, query } = await req.json()
          if (!type || !query || !clientId) {
            throw new Error('Missing required parameters')
          }

          // Execute the initial query
          let result
          if (type === 'count') {
            result = await req.payload.count(query)
          } else if (type === 'find') {
            result = await req.payload.find(query)
          } else if (type === 'findByID') {
            result = await req.payload.findByID(query)
          } else {
            throw new Error(`Unsupported query type: ${type}`)
          }

          const subscriptionId = `${type}-${JSON.stringify(query)}`
          if (!subscriptions.has(subscriptionId)) {
            subscriptions.set(subscriptionId, {
              type,
              clients: new Set(),
              query,
            })
          }

          // Add this client to the subscription
          const subscription = subscriptions.get(subscriptionId)!
          const existingClient = Array.from(subscription.clients).find(
            (client) => client.clientId === clientId,
          )
          if (existingClient) {
            subscription.clients.add(existingClient)
          }

          console.log('result', result)

          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          })
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          console.error(error)
          return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
          })
        }
      },
      method: 'post',
      path: '/payload-query',
    }

    const payloadSSEEndpoint: Endpoint = {
      handler: async (req) => {
        try {
          const clientId = `client-${Date.now()}-${Math.random()}`
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

          // Send initial heartbeat with clientId
          const encoder = new TextEncoder()
          await writer.write(encoder.encode(`data: ${JSON.stringify({ clientId })}\n\n`))

          // Store client connection
          const client = { clientId, response, writer }
          clients.add(client)

          // Clean up when client disconnects
          req.signal?.addEventListener('abort', () => {
            // Remove this client from all subscriptions
            for (const subscription of subscriptions.values()) {
              subscription.clients.delete(client)
            }
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

    return {
      ...config,
      collections: config.collections?.map((collection) => {
        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: [...(collection.hooks?.afterChange || []), myAfterChangeHook],
            afterDelete: [...(collection.hooks?.afterDelete || []), myAfterDeleteHook],
          },
        }
      }),
      endpoints: [...(config.endpoints || []), payloadQueryEndpoint, payloadSSEEndpoint],
    }
  }
