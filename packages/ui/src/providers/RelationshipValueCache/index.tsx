'use client'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useRef } from 'react'

type CachedDoc = {
  doc: Record<string, unknown>
  id: number | string
}

type PendingRequest = {
  collection: string
  ids: Set<number | string>
  locale: string
  resolve: () => void
  select: Record<string, true>
}

type RelationshipValueCacheContextType = {
  clearAll: () => void
  getCachedDoc: (collection: string, locale: string, id: number | string) => CachedDoc | undefined
  getDoc: (args: {
    collection: string
    id: number | string
    locale: string
    select: Record<string, true>
  }) => Promise<CachedDoc | undefined>
  invalidateDoc: (collection: string, locale: string, id: number | string) => void
  updateDoc: (collection: string, locale: string, id: number | string, doc: Record<string, unknown>) => void
}

const Context = createContext<RelationshipValueCacheContextType>({
  clearAll: () => {},
  getCachedDoc: () => undefined,
  getDoc: () => Promise.resolve(undefined),
  invalidateDoc: () => {},
  updateDoc: () => {},
})

export const useRelationshipValueCache = () => use(Context)

export const RelationshipValueCacheProvider: React.FC<{
  apiRoute: string
  children: React.ReactNode
  i18nLanguage: string
}> = ({ apiRoute, children, i18nLanguage }) => {
  // Cache: Map<`${collection}:${id}`, CachedDoc>
  const cacheRef = useRef<Map<string, CachedDoc>>(new Map())

  // Pending batch: Map<`${collection}:${locale}`, PendingRequest>
  const pendingBatchRef = useRef<Map<string, PendingRequest>>(new Map())

  // Tracks whether a microtask flush is scheduled
  const flushScheduledRef = useRef(false)

  // In-flight promises: Map<`${collection}:${id}`, Promise<CachedDoc | undefined>>
  const inFlightRef = useRef<Map<string, Promise<CachedDoc | undefined>>>(new Map())

  const flushBatch = useCallback(async () => {
    flushScheduledRef.current = false
    const batch = new Map(pendingBatchRef.current)
    pendingBatchRef.current.clear()

    await Promise.all(
      Array.from(batch.values()).map(async (pending) => {
        const { collection, ids, locale, resolve, select } = pending

        if (ids.size === 0) {
          resolve()
          return
        }

        const query = {
          depth: 0,
          draft: true,
          limit: ids.size,
          locale,
          select,
          where: {
            id: {
              in: Array.from(ids),
            },
          },
        }

        try {
          const response = await fetch(
            formatAdminURL({
              apiRoute,
              path: `/${collection}`,
            }),
            {
              body: qs.stringify(query),
              credentials: 'include',
              headers: {
                'Accept-Language': i18nLanguage,
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Payload-HTTP-Method-Override': 'GET',
              },
              method: 'POST',
            },
          )

          if (response.ok) {
            const data = await response.json()

            for (const doc of data.docs) {
              const cacheKey = `${collection}:${locale}:${doc.id}`
              cacheRef.current.set(cacheKey, { id: doc.id, doc })
            }

            // For IDs not found in the response, cache a placeholder to avoid refetching
            for (const id of ids) {
              const cacheKey = `${collection}:${locale}:${id}`
              if (!cacheRef.current.has(cacheKey)) {
                cacheRef.current.set(cacheKey, { id, doc: { id } })
              }
            }
          }
        } catch {
          // On error, don't cache — allow retry on next request
        }

        // Clean up in-flight entries for all IDs in this batch
        for (const id of ids) {
          inFlightRef.current.delete(`${collection}:${locale}:${id}`)
        }

        resolve()
      }),
    )
  }, [apiRoute, i18nLanguage])

  const scheduleBatchFlush = useCallback(() => {
    if (!flushScheduledRef.current) {
      flushScheduledRef.current = true
      // Use queueMicrotask to batch all synchronous getDoc calls in one tick
      queueMicrotask(() => {
        void flushBatch()
      })
    }
  }, [flushBatch])

  const getDoc = useCallback(
    async (args: {
      collection: string
      id: number | string
      locale: string
      select: Record<string, true>
    }): Promise<CachedDoc | undefined> => {
      const { id, collection, locale, select } = args
      const cacheKey = `${collection}:${locale}:${id}`

      // Return from cache if available
      const cached = cacheRef.current.get(cacheKey)
      if (cached) {
        return cached
      }

      // Return in-flight promise if already being fetched
      if (inFlightRef.current.has(cacheKey)) {
        return inFlightRef.current.get(cacheKey)
      }

      // Add to pending batch
      const batchKey = `${collection}:${locale}`
      let pending = pendingBatchRef.current.get(batchKey)

      if (!pending) {
        let resolvePromise: () => void
        const promise = new Promise<void>((r) => {
          resolvePromise = r
        })

        pending = {
          collection,
          ids: new Set(),
          locale,
          resolve: resolvePromise,
          select,
        }
        pendingBatchRef.current.set(batchKey, pending)

        // Store the flush promise for this batch
        const flushPromise = promise.then(() => cacheRef.current.get(cacheKey))
        inFlightRef.current.set(cacheKey, flushPromise)

        pending.ids.add(id)
        scheduleBatchFlush()
        return flushPromise
      }

      // Batch already exists — add ID and return a promise that resolves after flush
      pending.ids.add(id)

      // Merge select fields
      Object.assign(pending.select, select)

      // Create a promise that waits for this batch to flush
      const waitPromise = new Promise<CachedDoc | undefined>((resolve) => {
        const originalResolve = pending.resolve
        pending.resolve = () => {
          originalResolve()
          resolve(cacheRef.current.get(cacheKey))
        }
      })

      inFlightRef.current.set(cacheKey, waitPromise)
      scheduleBatchFlush()
      return waitPromise
    },
    [scheduleBatchFlush],
  )

  const getCachedDoc = useCallback((collection: string, locale: string, id: number | string) => {
    return cacheRef.current.get(`${collection}:${locale}:${id}`)
  }, [])

  const invalidateDoc = useCallback((collection: string, locale: string, id: number | string) => {
    cacheRef.current.delete(`${collection}:${locale}:${id}`)
    inFlightRef.current.delete(`${collection}:${locale}:${id}`)
  }, [])

  const updateDoc = useCallback(
    (collection: string, locale: string, id: number | string, doc: Record<string, unknown>) => {
      cacheRef.current.set(`${collection}:${locale}:${id}`, { id, doc: { ...doc, id } })
    },
    [],
  )

  const clearAll = useCallback(() => {
    cacheRef.current.clear()
    inFlightRef.current.clear()
  }, [])

  const value: RelationshipValueCacheContextType = React.useMemo(
    () => ({ clearAll, getCachedDoc, getDoc, invalidateDoc, updateDoc }),
    [clearAll, getCachedDoc, getDoc, invalidateDoc, updateDoc],
  )

  return <Context value={value}>{children}</Context>
}
