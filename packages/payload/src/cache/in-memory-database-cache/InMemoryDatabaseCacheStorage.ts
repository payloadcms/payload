import type { DatabaseCacheOptions, DatabaseCacheStorage } from '../types.js'

import { createDatabaseCache } from '../createDatabaseCache.js'

export class InMemoryDatabaseCacheStorage implements DatabaseCacheStorage {
  private cache = new Map<string, { expiresAt: null | number; tags: string[]; value: unknown }>()

  private get(key: string) {
    const cachedItem = this.cache.get(key)
    if (!cachedItem) return null

    if (cachedItem.expiresAt && Date.now() > cachedItem.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cachedItem.value
  }

  cacheFn<T extends (...args: unknown[]) => Promise<unknown>>(
    callback: T,
    keyParts: string[],
    tags: string[],
    ttl?: number,
  ): T {
    const key = keyParts.join(',')

    const cachedFn = async (...args: unknown[]) => {
      const cachedValue = this.get(key)

      if (cachedValue) return cachedValue

      const result = await callback(...args)

      const expiresAt = ttl ? Date.now() + ttl : null

      this.cache.set(key, { expiresAt, tags, value: result })

      return result
    }

    return cachedFn as T
  }

  invalidateTags(tags: string[]): void {
    this.cache.forEach((value, key) => {
      if (value.tags.some((tag) => tags.includes(tag))) this.cache.delete(key)
    })
  }
}

export const inMemoryDatabaseCache = (options: DatabaseCacheOptions) => {
  return createDatabaseCache({ options, storage: new InMemoryDatabaseCacheStorage() })
}
