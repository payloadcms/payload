/* eslint-disable no-console */

import {
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type Config,
  type Endpoint,
  type Payload,
} from 'payload'

export { payloadQuery } from './payloadQuery.js'
export { usePayloadQuery } from './usePayloadQuery.js'

type PayloadQueryRequestBody =
  | { query: Parameters<Payload['count']>[0]; type: 'count' }
  | { query: Parameters<Payload['find']>[0]; type: 'find' }
  | { query: Parameters<Payload['findByID']>[0]; type: 'findByID' }

export const realtimePlugin =
  () =>
  (config: Config): Config => {
    const myAfterChangeHook: CollectionAfterChangeHook = (_args) => {
      // If the collection that changed has a registered reactive count, we have to trigger all its count listeners
      // If the collection that changed has a registered find and satisfies the where of the options, we have to trigger all its find listeners
      // If the document that changed has findById registered, we have to trigger all its find listeners
      console.log('myAfterChangeHook')
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
            return new Response('req.json is not a function', {
              status: 500,
            })
          }
          const { type, query } = (await req.json()) as unknown as PayloadQueryRequestBody
          console.log('payloadQueryEndpoint', query)

          if (!type || !query) {
            throw new Error('Missing query parameters')
          }

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
      endpoints: [...(config.endpoints || []), payloadQueryEndpoint],
    }
  }
