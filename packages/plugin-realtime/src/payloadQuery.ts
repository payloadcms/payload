import type { Payload } from 'payload'

import type { ReadOperation } from './usePayloadQuery.js'

type PayloadQueryResult<T extends ReadOperation> = Promise<{
  data: Awaited<ReturnType<Payload[T]>> | undefined
  error: Error | null
}>

export async function payloadQuery<T extends ReadOperation>(
  type: T,
  query: Parameters<Payload[T]>[0],
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
