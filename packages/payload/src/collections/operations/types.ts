/**
 * For "find" and "findByID" operations:
 * When true, will attempt to read from a KV store cache.
 * If found, skips reading from the database.
 *
 * For "update" and "updateByID" operations:
 * When true, will cache the result of this operation in a KV store.
 * Subsequent reads will return the cached result until the cache is cleared or the expiry is reached.
 */
export type SharedOperationArgs = {
  /**
   * Whether to cache the result in a KV store.
   * @see https://payloadcms.com/docs/database/cache
   */
  cache?: boolean
}

export type CachedDocument<T extends Document> = {
  doc: T
  /**
   * Set an expiry time for the cached document.
   * When the cache is read, this value is checked against the current time.
   * If the current time is past the expiry time, the cache will be deleted and the operation will query the database.
   */
  expiresAt?: string
  updatedAt: string
}
