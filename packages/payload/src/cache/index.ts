import type { CollectionSlug, DefaultDocumentIDType, GlobalSlug } from '../index.js'
import type { JsonObject, Payload } from '../types/index.js'
import type { CacheArgs, CachedDocument } from './types.js'

import { formatCacheKey } from './formatKey.js'

export { formatCacheKey }
export { parseCacheKey } from './parseKey.js'

/**
 * Creates a cache entry for a document.
 */
export const createCache = async <T extends JsonObject>({
  collection,
  doc,
  expiresAt,
  global,
  payload,
}: CacheArgs<T>) => {
  const key = formatCacheKey({
    id: doc.id,
    collectionSlug: collection,
    globalSlug: global,
  })

  const cachedDocument: CachedDocument<JsonObject> = {
    doc,
    expiresAt,
    updatedAt: new Date().toISOString(),
  }

  await payload.kv.set(key, cachedDocument)
}

/**
 * Retrieves a cached document.
 */
export const getCache = async <T extends JsonObject>({
  id,
  collection,
  global,
  payload,
}: {
  payload: Payload
} & (
  | { collection: CollectionSlug; global?: never; id: DefaultDocumentIDType }
  | { collection?: undefined; global: GlobalSlug; id?: never }
)): Promise<CachedDocument<T> | null> => {
  const cacheKey = formatCacheKey({
    id,
    collectionSlug: collection,
    globalSlug: global,
  })

  const cache = await payload.kv?.get<CachedDocument<T>>(cacheKey)

  if (!cache) {
    return null
  }

  const hasExpired = cache.expiresAt && cache.expiresAt < new Date().toISOString()

  if (hasExpired) {
    await payload.kv?.delete(cacheKey)
    return null
  }

  return cache
}

export const updateCache = async <T extends JsonObject>({
  collection,
  doc,
  expiresAt,
  global,
  payload,
}: CacheArgs<T>) => {
  const cacheKey = formatCacheKey({
    id: doc.id,
    collectionSlug: collection,
    globalSlug: global,
  })

  let existingCache

  if (collection) {
    existingCache = await getCache<JsonObject>({
      id: doc.id,
      collection,
      payload,
    })
  } else if (global) {
    existingCache = await getCache<JsonObject>({
      global,
      payload,
    })
  }

  if (!existingCache) {
    throw new Error('No existing cache to update')
  }

  const updatedCache: CachedDocument<JsonObject> = {
    ...existingCache,
    doc: {
      ...existingCache.doc,
      ...doc,
    },
    expiresAt,
    updatedAt: new Date().toISOString(),
  }

  await payload.kv?.set(cacheKey, updatedCache)
}

/**
 * Upserts a cached document (updates or creates).
 */
export const upsertCache = async <T extends JsonObject>({
  collection,
  doc,
  expiresAt,
  global,
  payload,
}: CacheArgs<T>) => {
  try {
    await updateCache<T>({ collection, doc, expiresAt, global, payload })
    return
  } catch (_err) {
    // No existing cache, proceed to create
  }

  await createCache<T>({ collection, doc, expiresAt, global, payload })
}

/**
 * Deletes a cached document.
 */
export const deleteCache = async ({
  id,
  collection,
  global,
  payload,
}: {
  collection: CollectionSlug
  global?: GlobalSlug
  id: DefaultDocumentIDType
  payload: Payload
}): Promise<void> => {
  const cacheKey = formatCacheKey({
    id,
    collectionSlug: collection,
    globalSlug: global,
  })

  await payload.kv?.delete(cacheKey)
}
