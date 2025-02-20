/* eslint-disable no-console */
'use client'
import type { Payload } from 'payload'

import type { StringifiedQuery } from '../index.js'
import type { ReadOperation } from '../usePayloadQuery.js'

type PayloadQueryResult<T extends ReadOperation> = Promise<{
  data: Awaited<ReturnType<Payload[T]>> | undefined
  error: Error | null
}>

type PayloadQueryArgs<T extends ReadOperation> = {
  clientId: string
  options?: {
    onChange?: (result: PayloadQueryResult<T>) => void
  }
  queryParams: Parameters<Payload[T]>[0]
  type: T
}

// TODO: this should not be exported, rename to _payloadQuery (take care in line 67, should call _payloadQuery)
export async function _payloadQuery<T extends ReadOperation>(
  args: PayloadQueryArgs<T>,
): PayloadQueryResult<T> {
  try {
    const { type, clientId, options, queryParams } = args
    const response = await fetch(`/api/payload-query`, {
      body: JSON.stringify({ type, clientId, queryParams }),
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

type QuerySubscription = {
  options?: { onChange?: (result: PayloadQueryResult<ReadOperation>) => void }
  stringifiedQuery: StringifiedQuery
}

export function createPayloadClient(): {
  payloadQuery: (
    type: ReadOperation,
    queryParams: Parameters<Payload[ReadOperation]>[0],
    options?: { onChange?: (result: PayloadQueryResult<ReadOperation>) => void },
  ) => PayloadQueryResult<ReadOperation>
} {
  const clientId = `client-${Date.now()}-${Math.random()}`
  const querySubscriptions = new Map<StringifiedQuery, Set<QuerySubscription>>()
  let eventSource: EventSource | null = null

  const connectSSE = () => {
    if (typeof window === 'undefined' || eventSource) {
      return
    }

    eventSource = new EventSource(`/api/payload-sse?clientId=${clientId}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // ignore initial connection message
        if (data === 'connected') {
          return
        }
        const { queryResult, stringifiedQuery } = data as {
          queryResult: PayloadQueryResult<ReadOperation>
          stringifiedQuery: StringifiedQuery
        }

        // Notify all subscribers that match this data update
        const querySubscription = querySubscriptions.get(stringifiedQuery)
        if (querySubscription) {
          querySubscription.forEach(({ options }) => options?.onChange?.(queryResult))
        }
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

  connectSSE()

  return {
    payloadQuery: (type, queryParams, options) => {
      const stringifiedQuery = JSON.stringify({ type, queryParams })

      if (options?.onChange) {
        let callbacks = querySubscriptions.get(stringifiedQuery)
        if (!callbacks) {
          callbacks = new Set()
          querySubscriptions.set(stringifiedQuery, callbacks)
        }
        callbacks.add({ options, stringifiedQuery })
      }

      return _payloadQuery({ type, clientId, options, queryParams })
    },
  }
}
