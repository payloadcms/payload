'use client'
import type { Payload } from 'payload'

import { createContext, use, useEffect, useLayoutEffect, useState } from 'react'

import type { PayloadQueryFn } from '../vanilla/payloadQuery.js'

import { createPayloadClient } from '../vanilla/payloadQuery.js'
type ReadOperation = 'count' | 'find' | 'findByID'

// TODO: improve type. error, data and isLoading cannot accept all possible combinations
type PayloadQueryResult<T extends ReadOperation> = Promise<{
  data: Awaited<ReturnType<Payload[T]>> | undefined
  error: Error | null
  isLoading: boolean
}>

export function usePayloadQuery<T extends ReadOperation>(
  type: T,
  query: Parameters<Payload[T]>[0],
): Awaited<PayloadQueryResult<T>> {
  const payloadQuery = use(PayloadQueryContext)
  const [result, setResult] = useState<Awaited<PayloadQueryResult<T>>>({
    data: undefined,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    if (!payloadQuery) {
      return
    }

    let isMounted = true

    const fetchData = async () => {
      if (!isMounted) {
        return
      }
      setResult({ data: undefined, error: null, isLoading: true })
      try {
        const promise = payloadQuery(type, query)
        const { data, error } = await promise
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

    // eslint-disable-next-line no-console
    fetchData().catch(console.error)

    return () => {
      isMounted = false
    }
  }, [payloadQuery, query, type]) // Serialize query object to compare values instead of references

  return result
}

const PayloadQueryContext = createContext<PayloadQueryFn | undefined>(undefined)

export function PayloadQueryClientProvider({ children }: { children: React.ReactNode }) {
  const [payloadClient, setPayloadClient] = useState<PayloadQueryFn>()

  useLayoutEffect(() => {
    const client = createPayloadClient()
    setPayloadClient(client.payloadQuery)
  }, [])

  return (
    <PayloadQueryContext.Provider value={payloadClient}>{children}</PayloadQueryContext.Provider>
  )
}
