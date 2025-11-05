import type { CollectionSlug } from '../index.js'
import type { JsonObject, Payload } from '../types/index.js'

export type CacheArgs = {
  collection?: CollectionSlug
  doc: JsonObject
  payload: Payload
}

export type CachedDocument<T extends any> = {
  doc: T
  /**
   * Set an expiry time for the cached document.
   * When the cache is read, this value is checked against the current time.
   * If the current time is past the expiry time, the cache will be deleted and the operation will query the database.
   */
  expiresAt?: string
  updatedAt: string
}
