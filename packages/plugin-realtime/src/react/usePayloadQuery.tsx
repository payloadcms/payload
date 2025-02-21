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
    if (typeof payloadQuery !== 'function') {
      return
    }

    let isMounted = true

    const fetchData = async () => {
      setResult({ data: undefined, error: null, isLoading: true })
      try {
        const promise = payloadQuery(type, query, {
          onChange: (result) => {
            setResult({
              data: result.data,
              error: result.error,
              isLoading: false,
            })
          },
        })
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

    fetchData().catch(console.error)

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadQuery, type, JSON.stringify(query)])

  return result
}

const PayloadQueryContext = createContext<PayloadQueryFn | undefined>(undefined)

export function PayloadQueryClientProvider({ children }: { children: React.ReactNode }) {
  const [payloadClient, setPayloadClient] = useState<PayloadQueryFn>(() => {
    return () => Promise.reject(new Error('PayloadQuery client not initialized'))
  })

  useLayoutEffect(() => {
    const client = createPayloadClient()
    setPayloadClient(() => client.payloadQuery)
  }, [])

  if (!payloadClient) {
    return null // or a loading indicator
  }

  return (
    <PayloadQueryContext.Provider value={payloadClient}>{children}</PayloadQueryContext.Provider>
  )
}
