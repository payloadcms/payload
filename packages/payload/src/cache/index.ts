import type { CollectionSlug, DefaultDocumentIDType, GlobalSlug } from '../index.js'
import type { JsonObject, Payload } from '../types/index.js'
import type { CacheArgs, CachedDocument } from './types.js'

import { formatCacheKey } from './formatKey.js'

export const cacheDocument = async ({ collection, doc, expiresAt, global, payload }: CacheArgs) => {
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

export const getDocumentCache = async <T extends any>({
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

export const deleteDocumentCache = async ({
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
