import type { DatabaseCacheOptions } from 'payload'

import { createDatabaseCache } from 'payload'

import { NextDatabaseCacheStorage } from './NextDatabaseCacheStorage.js'

export const nextDatabaseCache = (options: DatabaseCacheOptions) => {
  return createDatabaseCache({ options, storage: new NextDatabaseCacheStorage() })
}
