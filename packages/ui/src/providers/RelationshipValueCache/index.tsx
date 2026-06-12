'use client'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useRef } from 'react'

import { useAuth } from '../Auth/index.js'

type CacheKey = `${string}:${string}:${number | string}`
type BatchKey = `${string}:${string}`

const toCacheKey = (collection: string, locale: string, id: number | string): CacheKey =>
  `${collection}:${locale}:${id}`

const toBatchKey = (collection: string, locale: string): BatchKey => `${collection}:${locale}`

type CachedDoc = {
  doc: Record<string, unknown>
  id: number | string
}

type PendingResolver = {
  cacheKey: CacheKey
  resolve: (value: CachedDoc | undefined) => void
}

type PendingRequest = {
  collection: string
  ids: Set<number | string>
  locale: string
  resolvers: PendingResolver[]
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
  updateDoc: (
    collection: string,
    locale: string,
    id: number | string,
    doc: Record<string, unknown>,
  ) => void
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
  const cacheRef = useRef<Map<CacheKey, CachedDoc>>(new Map())
  const pendingBatchRef = useRef<Map<BatchKey, PendingRequest>>(new Map())

  // Tracks whether a microtask flush is scheduled
  const flushScheduledRef = useRef(false)
  const inFlightRef = useRef<Map<CacheKey, Promise<CachedDoc | undefined>>>(new Map())

  const flushBatch = useCallback(async () => {
    flushScheduledRef.current = false
    const batch = new Map(pendingBatchRef.current)
    pendingBatchRef.current.clear()

    await Promise.all(
      Array.from(batch.values()).map(async (pending) => {
        const { collection, ids, locale, resolvers, select } = pending

        if (ids.size === 0) {
          for (const { resolve } of resolvers) {
            resolve(undefined)
          }
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
              const key = toCacheKey(collection, locale, doc.id)
              cacheRef.current.set(key, { id: doc.id, doc })
            }

            // For IDs not found in the response, cache a placeholder to avoid refetching
            for (const id of ids) {
              const key = toCacheKey(collection, locale, id)
              if (!cacheRef.current.has(key)) {
                cacheRef.current.set(key, { id, doc: { id } })
              }
            }
          }
        } catch {
          // On error, don't cache — allow retry on next request
        }

        // Clean up in-flight entries for all IDs in this batch
        for (const id of ids) {
          inFlightRef.current.delete(toCacheKey(collection, locale, id))
        }

        // Resolve all waiting callers individually
        for (const { cacheKey, resolve } of resolvers) {
          resolve(cacheRef.current.get(cacheKey))
        }
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
    (args: {
      collection: string
      id: number | string
      locale: string
      select: Record<string, true>
    }): Promise<CachedDoc | undefined> => {
      const { id, collection, locale, select } = args
      const key = toCacheKey(collection, locale, id)

      // Return from cache if available
      const cached = cacheRef.current.get(key)
      if (cached) {
        return Promise.resolve(cached)
      }

      // Return in-flight promise if already being fetched
      const inFlight = inFlightRef.current.get(key)
      if (inFlight !== undefined) {
        return inFlight
      }

      // Add to pending batch
      const batch = toBatchKey(collection, locale)
      let pending = pendingBatchRef.current.get(batch)

      if (!pending) {
        pending = {
          collection,
          ids: new Set(),
          locale,
          resolvers: [],
          select,
        }
        pendingBatchRef.current.set(batch, pending)
      } else {
        // Merge select fields from different callers
        Object.assign(pending.select, select)
      }

      pending.ids.add(id)

      const promise = new Promise<CachedDoc | undefined>((resolve) => {
        pending.resolvers.push({ cacheKey: key, resolve })
      })

      inFlightRef.current.set(key, promise)
      scheduleBatchFlush()
      return promise
    },
    [scheduleBatchFlush],
  )

  const getCachedDoc = useCallback((collection: string, locale: string, id: number | string) => {
    return cacheRef.current.get(toCacheKey(collection, locale, id))
  }, [])

  const invalidateDoc = useCallback((collection: string, locale: string, id: number | string) => {
    const key = toCacheKey(collection, locale, id)
    cacheRef.current.delete(key)
    inFlightRef.current.delete(key)
  }, [])

  const updateDoc = useCallback(
    (collection: string, locale: string, id: number | string, doc: Record<string, unknown>) => {
      cacheRef.current.set(toCacheKey(collection, locale, id), { id, doc: { ...doc, id } })
    },
    [],
  )

  const clearAll = useCallback(() => {
    cacheRef.current.clear()
    inFlightRef.current.clear()
  }, [])

  // Clear cache when the authenticated user changes (login/logout/switch).
  // Retaining resolved relationship labels across auth boundaries could leak
  // data the new user isn't permitted to see.
  const { user } = useAuth()
  const userID = user?.id ?? null
  const previousUserIDRef = useRef(userID)
  useEffect(() => {
    if (previousUserIDRef.current !== userID) {
      previousUserIDRef.current = userID
      clearAll()
    }
  }, [userID, clearAll])

  const value: RelationshipValueCacheContextType = React.useMemo(
    () => ({ clearAll, getCachedDoc, getDoc, invalidateDoc, updateDoc }),
    [clearAll, getCachedDoc, getDoc, invalidateDoc, updateDoc],
  )

  return <Context value={value}>{children}</Context>
}
