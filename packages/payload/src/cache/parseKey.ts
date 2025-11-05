import type { CollectionSlug, DefaultDocumentIDType, GlobalSlug } from '../index.js'

/**
 * Parses the `entitySlug` and the `docID` from a given cache key.
 * These keys are formatted by the `formatKey` utility.
 */
export const parseCacheKey = (
  key?: string,
): {
  collectionSlug?: CollectionSlug
  entityType: 'collection' | 'global' | null
  globalSlug?: GlobalSlug
  id: DefaultDocumentIDType
} => {
  if (!key) {
    throw new Error('Missing key to parse')
  }

  // We know the first segment is always the entity type, followed by the entity slug and document ID
  // For example, `c_articles_12345` => entity type: collection (`c`), entity slug: `articles`, document ID: `12345`.
  // Note: don't split on `_` and blindly use indexes, as the entity slug itself may contain underscores
  // const first remove prefix
  const parts = key.split('_')
  const id = parts.pop() as DefaultDocumentIDType

  const entityType = parts[0] === 'c' ? 'collection' : parts[1] === 'g' ? 'global' : null
  const entitySlug = parts[2]

  return {
    id,
    collectionSlug: entityType === 'collection' ? entitySlug : '',
    entityType,
    globalSlug: entityType === 'global' ? entitySlug : undefined,
  }
}

/**
 * Formats the key used to store the visual editing document in the KV store.
 * The format is `${entityType}_${entitySlug}_${docID}`.
 * For example: `c_articles_12345` for a document in the "Articles" collection.
 */
export const formatCacheKey = ({
  id,
  collectionSlug,
  globalSlug,
  prefix,
}: {
  collectionSlug?: CollectionSlug
  globalSlug?: GlobalSlug
  id?: DefaultDocumentIDType
  prefix?: string
}): string => {
  return [prefix, collectionSlug ? 'c' : 'g', collectionSlug, globalSlug, id]
    .filter(Boolean)
    .join('_')
}
