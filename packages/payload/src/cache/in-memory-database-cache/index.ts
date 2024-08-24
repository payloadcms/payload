import type { DatabaseCacheOptions } from '../types.js'

import { createDatabaseCache } from '../createDatabaseCache.js'
import { InMemoryDatabaseCacheStorage } from './InMemoryDatabaseCacheStorage.js'

export const inMemoryDatabaseCache = (options: DatabaseCacheOptions) => {
  return createDatabaseCache({
    options: {
      ...options,
    },
    storage: new InMemoryDatabaseCacheStorage(),
  })
}
