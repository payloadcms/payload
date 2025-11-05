import type { CollectionSlug, DefaultDocumentIDType } from '../index.js'
import type { JsonObject, Payload } from '../types/index.js'
import type { CacheArgs, CachedDocument } from './types.js'

import { formatCacheKey } from './formatKey.js'

export const cacheDocument = async ({ collection, doc, payload }: CacheArgs) => {
  const key = formatCacheKey({
    id: doc.id,
    collectionSlug: collection,
  })

  const cachedDocument: CachedDocument<JsonObject> = {
    doc,
    updatedAt: new Date().toISOString(),
  }

  await payload.kv.set(key, cachedDocument)
}

export const getDocumentCache = async <T extends any>({
  id,
  collection,
  payload,
}: {
  collection: CollectionSlug
  id: DefaultDocumentIDType
  payload: Payload
}): Promise<CachedDocument<T> | null> => {
  const cacheKey = formatCacheKey({
    id,
    collectionSlug: collection,
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

export const deleteDocumentCache = async ({
  id,
  collection,
  payload,
}: {
  collection: CollectionSlug
  id: DefaultDocumentIDType
  payload: Payload
}): Promise<void> => {
  const cacheKey = formatCacheKey({
    id,
    collectionSlug: collection,
  })

  await payload.kv?.delete(cacheKey)
}
