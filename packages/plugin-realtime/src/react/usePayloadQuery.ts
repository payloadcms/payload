'use client'
import type { Payload } from 'payload'

import { useEffect, useState } from 'react'

import { payloadQuery } from '../vanilla/payloadQuery.js'

export type ReadOperation = 'count' | 'find' | 'findByID'

// TODO: improve type. error, data and isLoading cannot accept all possible combinations
export type PayloadQueryResult<T extends ReadOperation> = {
  data: Awaited<ReturnType<Payload[T]>> | undefined
  error: Error | null
  isLoading: boolean
}

export function usePayloadQuery<T extends ReadOperation>(
  type: T,
  query: Parameters<Payload[T]>[0],
): Awaited<PayloadQueryResult<T>> {
  const [result, setResult] = useState<PayloadQueryResult<T>>({
    data: undefined,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!isMounted) {
        return
      }

      setResult({ data: undefined, error: null, isLoading: true })
      try {
        const { data, error } = await payloadQuery(type, query)
        if (isMounted) {
          setResult({ data, error, isLoading: false })
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        if (isMounted) {
          setResult({ data: undefined, error, isLoading: false })
        }
      }
    }

    fetchData().catch(console.error)

    return () => {
      isMounted = false
    }
  }, [type, JSON.stringify(query)]) // Serialize query object to compare values instead of references

  return result
}
