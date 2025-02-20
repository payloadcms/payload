/* eslint-disable no-console */
'use client'
import type { Payload } from 'payload'

import type { ReadOperation } from '../usePayloadQuery.js'

type PayloadQueryResult<T extends ReadOperation> = Promise<{
  data: Awaited<ReturnType<Payload[T]>> | undefined
  error: Error | null
}>

// TODO: this should not be exported, rename to _payloadQuery (take care in line 67, should call _payloadQuery)
export async function payloadQuery<T extends ReadOperation>(
  type: T,
  query: Parameters<Payload[T]>[0],
  _options?: {
    onChange?: (result: PayloadQueryResult<T>) => void
  },
): PayloadQueryResult<T> {
  try {
    const response = await fetch(`/api/payload-query`, {
      body: JSON.stringify({ type, query }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    const data = await response.json()
    return { data, error: null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    return { data: undefined, error }
  }
}

export function createPayloadClient(): { payloadQuery: typeof payloadQuery } {
  let clientId: null | string = null
  const subscriptions = new Map<string, Set<(result: PayloadQueryResult<ReadOperation>) => void>>()
  let eventSource: EventSource | null = null

  const connectSSE = () => {
    if (typeof window === 'undefined' || eventSource) {
      return
    }

    eventSource = new EventSource('/api/payload-sse')

    eventSource.onmessage = (event) => {
      try {
        console.log('event.data', event.data)
        // initial connection message
        const data = JSON.parse(event.data)
        if (data.clientId) {
          clientId = data.clientId
        }

        // Notify all subscribers that match this data update
        subscriptions.forEach((callbacks, queryKey) => {
          const { type, query } = JSON.parse(queryKey)
          callbacks.forEach((callback) => callback(Promise.resolve({ data, error: null })))
        })
      } catch (err) {
        console.error('Error processing server-sent event:', err)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      eventSource?.close()
      eventSource = null
      // Attempt to reconnect after a delay
      setTimeout(connectSSE, 5000)
    }
  }

  return {
    payloadQuery: (type, query, options) => {
      const queryKey = JSON.stringify({ type, clientId, query })

      if (options?.onChange) {
        let callbacks = subscriptions.get(queryKey)
        if (!callbacks) {
          callbacks = new Set()
          subscriptions.set(queryKey, callbacks)
        }
        callbacks.add(options.onChange)

        // Ensure SSE connection is established when we have subscribers
        connectSSE()
      }

      return payloadQuery(type, query, options)
    },
  }
}
