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
export { createPayloadClient } from './vanilla/payloadQuery.js'

type Client = {
  clientId: string
  response: Response
  writer: WritableStreamDefaultWriter<any>
}

type QuerySubscription = {
  clients: Set<string> // clientId
  queryParams: Parameters<Payload[ReadOperation]>[0]
  type: 'count' | 'find' | 'findByID'
}

export type Query<T extends ReadOperation> = {
  queryParams: Parameters<Payload[T]>[0]
  type: T
}
export type StringifiedQuery = string

const querySubscriptions = new Map<StringifiedQuery, QuerySubscription>()
const clients = new Map<string, Client>()

const sendToClients = async (querySubscription: QuerySubscription, payload: Payload) => {
  const { type, queryParams } = querySubscription
  let result: Awaited<ReturnType<Payload[ReadOperation]>> | undefined

  if (type === 'count') {
    result = await payload.count(queryParams)
  } else if (type === 'find') {
    result = await payload.find(queryParams)
  } else if (type === 'findByID') {
    result = await payload.findByID(queryParams)
  } else {
    throw new Error('Invalid query type')
  }

  try {
    await Promise.all(
      Array.from(querySubscription.clients).map(async (clientId) => {
        const client = clients.get(clientId)
        if (!client) {
          throw new Error('Client not found')
        }
        await client.writer.write(
          new TextEncoder().encode(
            `data: ${JSON.stringify({
              queryResult: result,
              stringifiedQuery: {
                type,
                queryParams,
              },
            })}\n\n`,
          ),
        )
      }),
    )
  } catch (error) {
    console.error('Error sending to clients:', error)
  }
  console.log('sendToClients done', result)
}

export const realtimePlugin =
  () =>
  (config: Config): Config => {
    const myAfterChangeHook: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
      for (const [, querySubscription] of querySubscriptions) {
        if (querySubscription.type === 'count') {
          // Always refresh count queries for the affected collection
          if (querySubscription.queryParams.collection === collection.slug) {
            await sendToClients(querySubscription, req.payload)
          }
        } else if (querySubscription.type === 'find') {
          // Refresh find queries if the collection matches
          if (querySubscription.queryParams.collection === collection.slug) {
            await sendToClients(querySubscription, req.payload)
          }
        } else if (querySubscription.type === 'findByID') {
          // Refresh findByID queries if the specific document changed
          if (
            querySubscription.queryParams.collection === collection.slug &&
            querySubscription.queryParams.id === doc.id
          ) {
            await sendToClients(querySubscription, req.payload)
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
          console.log('\n\npayloadQueryEndpoint\n\n')
          if (!req.json) {
            return new Response('req.json is not a function', { status: 500 })
          }
          const body = await req.json()
          console.log('req.json 0', body)

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
            result = await req.payload.findByID(queryParams)
          } else {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
      handler: (req) => {
        try {
          console.log('\n\npayloadSSEEndpoint\n\n')
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
          console.log('clientId', clientId)
          if (!clientId) {
            throw new Error('Missing required parameters')
          }

          // Send initial heartbeat with clientId
          // await writer.write(new TextEncoder().encode(`data: ${JSON.stringify({ clientId })}\n\n`))

          // Store client connection
          const client = { clientId, response, writer }
          clients.set(clientId, client)
          console.log('client added successfully')

          // Clean up when client disconnects
          req.signal?.addEventListener('abort', () => {
            console.log('client disconnected', clientId)
            // Remove this client from all querySubscriptions
            for (const subscription of querySubscriptions.values()) {
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
