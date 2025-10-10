import type { DeepPartial } from 'ts-essentials'

import type { DataFromCollectionSlug } from '../collections/config/types.js'
import type { DataFromGlobalSlug } from '../globals/config/types.js'
import type { CollectionSlug, GlobalSlug } from '../index.js'

/**
 * Atomic operations for collection relationship fields with hasMany: true
 */
export type AtomicOperations<TSlug extends CollectionSlug = CollectionSlug> = {
  $push?: DeepPartial<DataFromCollectionSlug<TSlug>>
  $remove?: DeepPartial<DataFromCollectionSlug<TSlug>>
}

/**
 * Atomic operations for global relationship fields with hasMany: true
 */
export type GlobalAtomicOperations<TSlug extends GlobalSlug = GlobalSlug> = {
  $push?: DeepPartial<DataFromGlobalSlug<TSlug>>
  $remove?: DeepPartial<DataFromGlobalSlug<TSlug>>
}
