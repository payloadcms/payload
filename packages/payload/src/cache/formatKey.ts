import type { CollectionSlug, DefaultDocumentIDType, GlobalSlug } from '../index.js'

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
