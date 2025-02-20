import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'

import type { ReadOperation } from '../usePayloadQuery.js'
import type { QuerySubscription } from './index.js'

import { clients, querySubscriptions } from './endpoints.js'

const sendToClients = async (querySubscription: QuerySubscription, payload: Payload) => {
  const { type, queryParams } = querySubscription
  let result: Awaited<ReturnType<Payload[ReadOperation]>> | undefined

  if (type === 'count') {
    result = await payload.count(queryParams)
  } else if (type === 'find') {
    result = await payload.find(queryParams)
  } else if (type === 'findByID') {
    result = await payload.findByID(queryParams as Parameters<Payload['findByID']>[0])
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
              stringifiedQuery: JSON.stringify({ type, queryParams }),
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

export const myAfterChangeHook: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
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
        (querySubscription.queryParams as Parameters<Payload['findByID']>[0]).id === doc.id
      ) {
        await sendToClients(querySubscription, req.payload)
      }
    }
  }
}

export const myAfterDeleteHook: CollectionAfterDeleteHook = (_args) => {
  // If the collection that changed has a registered reactive count, we have to trigger all its count listeners
  // If the collection that changed has a registered find and satisfies the where of the options, we have to trigger all its find listeners
  // If the document that changed has findById registered, we have to trigger all its find listeners (set to null)
  //   console.log('myAfterDeleteHook')
}
