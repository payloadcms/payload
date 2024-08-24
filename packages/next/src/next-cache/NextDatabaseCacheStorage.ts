import type { DatabaseCacheStorage } from 'payload'

import { revalidateTag, unstable_cache } from 'next/cache.js'

export class NextDatabaseCacheStorage implements DatabaseCacheStorage {
  cacheFn<T extends (...args: unknown[]) => Promise<unknown>>(
    callback: T,
    keyParts: string[],
    tags: string[],
    revalidate?: number,
  ): T {
    const cachedFn = unstable_cache(callback, keyParts, { revalidate, tags })

    return cachedFn
  }

  invalidateTags(tags: string[]): Promise<void> | void {
    tags.forEach(revalidateTag)
  }
}
