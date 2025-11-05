export type SharedOperationArgs = {
  /**
   * For "findOne" operations:
   * When true, will attempt to read from a KV store cache.
   * If found, skips reading from the database.
   *
   * For "update" operations:
   * When true, will cache the result of this operation in a KV store.
   * Subsequent reads will return the cached result until the cache is cleared or the expiry is reached.
   *
   * @see https://payloadcms.com/docs/database/cache
   */
  cache?: boolean
}
