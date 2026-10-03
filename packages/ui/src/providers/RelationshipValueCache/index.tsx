'use client'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useRef } from 'react'

import { useAuth } from '../Auth/index.js'
import { usePathname } from '../RouterAdapter/index.js'

type CacheKey = `${string}:${string}:${number | string}`
type BatchKey = `${string}:${string}`

const toCacheKey = ({ id, collection, locale }: DocLocation): CacheKey =>
  `${collection}:${locale}:${id}`

const toBatchKey = ({ collection, locale }: Omit<DocLocation, 'id'>): BatchKey =>
  `${collection}:${locale}`

type CachedDoc = {
  doc: Record<string, unknown>
  id: number | string
}

type PendingResolver = {
  cacheKey: CacheKey
  promise: Promise<CachedDoc | undefined>
  resolve: (value: CachedDoc | undefined) => void
}

type PendingRequest = {
  collection: string
  ids: Set<number | string>
  locale: string
  resolvers: PendingResolver[]
  select: Record<string, true>
}

type DocLocation = {
  collection: string
  id: number | string
  locale: string
}

type RelationshipValueCacheContextType = {
  clearAll: () => void
  getCachedDoc: (args: DocLocation) => CachedDoc | undefined
  getDoc: (args: { select: Record<string, true> } & DocLocation) => Promise<CachedDoc | undefined>
  invalidateDoc: (args: DocLocation) => void
  updateDoc: (args: { doc: Record<string, unknown> } & DocLocation) => void
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

  // Incremented on every explicit cache change, so responses to requests started
  // before it don't write outdated docs back into the cache
  const cacheGenerationRef = useRef(0)

  // Clear on navigation so edits made elsewhere don't show stale labels. Done during render
  // because child effects run before this provider's effects and would read the old cache.
  const pathname = usePathname()
  const cachedPathnameRef = useRef(pathname)

  if (cachedPathnameRef.current !== pathname) {
    cachedPathnameRef.current = pathname
    cacheGenerationRef.current++
    cacheRef.current.clear()
    inFlightRef.current.clear()
  }

  const flushBatch = useCallback(async () => {
    flushScheduledRef.current = false
    const batch = new Map(pendingBatchRef.current)
    pendingBatchRef.current.clear()
    const generation = cacheGenerationRef.current

    await Promise.all(
      Array.from(batch.values()).map(async (pending) => {
        const { collection, ids, locale, resolvers, select } = pending

        if (ids.size === 0) {
          for (const { resolve } of resolvers) {
            resolve(undefined)
          }
          return
        }

        const fetchedDocs = new Map<CacheKey, CachedDoc>()

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
              fetchedDocs.set(toCacheKey({ id: doc.id, collection, locale }), { id: doc.id, doc })
            }
          }
        } catch {
          // On error, don't cache — allow retry on next request
        }

        if (generation === cacheGenerationRef.current) {
          for (const [key, cachedDoc] of fetchedDocs) {
            cacheRef.current.set(key, cachedDoc)
          }
        }

        for (const { cacheKey, promise, resolve } of resolvers) {
          if (inFlightRef.current.get(cacheKey) === promise) {
            inFlightRef.current.delete(cacheKey)
          }

          resolve(fetchedDocs.get(cacheKey))
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
    ({
      id,
      collection,
      locale,
      select,
    }: { select: Record<string, true> } & DocLocation): Promise<CachedDoc | undefined> => {
      const key = toCacheKey({ id, collection, locale })

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
      const batch = toBatchKey({ collection, locale })
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

      let resolve!: PendingResolver['resolve']
      const promise = new Promise<CachedDoc | undefined>((res) => {
        resolve = res
      })

      pending.resolvers.push({ cacheKey: key, promise, resolve })
      inFlightRef.current.set(key, promise)
      scheduleBatchFlush()
      return promise
    },
    [scheduleBatchFlush],
  )

  const getCachedDoc = useCallback((docLocation: DocLocation) => {
    return cacheRef.current.get(toCacheKey(docLocation))
  }, [])

  const invalidateDoc = useCallback((docLocation: DocLocation) => {
    const key = toCacheKey(docLocation)
    cacheGenerationRef.current++
    cacheRef.current.delete(key)
    inFlightRef.current.delete(key)
  }, [])

  const updateDoc = useCallback(
    ({ doc, ...docLocation }: { doc: Record<string, unknown> } & DocLocation) => {
      cacheGenerationRef.current++
      cacheRef.current.set(toCacheKey(docLocation), {
        id: docLocation.id,
        doc: { ...doc, id: docLocation.id },
      })
    },
    [],
  )

  const clearAll = useCallback(() => {
    cacheGenerationRef.current++
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
