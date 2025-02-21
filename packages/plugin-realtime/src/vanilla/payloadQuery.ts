/* eslint-disable no-console */
'use client'

import type { Payload } from 'payload'

import type { ReadOperation, StringifiedQuery } from '../plugin/index.js'

const clientId = `client-${Date.now()}-${Math.random()}`
const querySubscriptions = new Map<StringifiedQuery, Set<QuerySubscription>>()
let eventSource: EventSource | null = null

export function createPayloadClient() {
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
          queryResult: Awaited<ReturnType<Payload[ReadOperation]>>
          stringifiedQuery: StringifiedQuery
        }

        // Notify all subscribers that match this data update
        const querySubscription = querySubscriptions.get(stringifiedQuery)
        if (querySubscription) {
          querySubscription.forEach(({ options }) =>
            options?.onChange?.({
              data: queryResult,
              error: null,
            }),
          )
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

  const payloadQuery: PayloadQueryFn = async (type, queryParams, options) => {
    try {
      // We add the onChange callback to the query subscriptions for future updates
      if (options && options?.onChange) {
        const stringifiedQuery = JSON.stringify({ type, queryParams })
        let callbacks = querySubscriptions.get(stringifiedQuery)
        if (!callbacks) {
          callbacks = new Set()
          querySubscriptions.set(stringifiedQuery, callbacks)
        }
        callbacks.add({ options, stringifiedQuery })
      }

      // The initial query request (). This request does not remain open.
      // It is immediate to obtain the initial value
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

  return { payloadQuery }
}

type QuerySubscription<T extends ReadOperation = ReadOperation> = {
  options?: { onChange?: (result: PayloadQueryResult<T>) => void }
  stringifiedQuery: StringifiedQuery
}

type PayloadQueryResult<T extends ReadOperation> = {
  data: Awaited<ReturnType<Payload[T]>> | undefined
  error: Error | null
}

export type PayloadQueryFn = <T extends ReadOperation>(
  type: T,
  queryParams: Parameters<Payload[T]>[0],
  options?: {
    onChange?: (result: PayloadQueryResult<T>) => void
  },
) => Promise<PayloadQueryResult<T>>
