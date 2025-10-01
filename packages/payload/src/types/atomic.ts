import type { DeepPartial } from 'ts-essentials'

import type { DataFromCollectionSlug } from '../collections/config/types.js'
import type { CollectionSlug } from '../index.js'

/**
 * Atomic operations for relationship fields with hasMany: true
 * Provides type safety based on the collection slug, same as the data property
 */
export type AtomicOperations<TSlug extends CollectionSlug = CollectionSlug> = {
  $push?: DeepPartial<DataFromCollectionSlug<TSlug>>
  $remove?: DeepPartial<DataFromCollectionSlug<TSlug>>
}
