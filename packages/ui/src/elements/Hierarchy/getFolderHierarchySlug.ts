/**
 * The shape both `ClientCollectionConfig` and `SanitizedCollectionConfig` satisfy for the purposes
 * of this lookup, so routing (which holds the sanitized config) and client components can share
 * one implementation.
 */
type FolderHierarchyCandidate = {
  hierarchy?:
    | {
        relatedCollections?: Record<string, { hasMany: boolean }>
      }
    | boolean
  slug: string
}

/**
 * Finds the slug of the folder-style hierarchy collection (allowHasMany: false) that
 * `collectionSlug` belongs to, by scanning each collection's `hierarchy.relatedCollections`.
 * Returns undefined if the collection has no folder field (e.g. it only has a tags field,
 * or no hierarchy field at all).
 */
export const getFolderHierarchySlug = (
  collections: FolderHierarchyCandidate[],
  collectionSlug: string,
): string | undefined =>
  collections.find((collection) => {
    if (!collection.hierarchy || typeof collection.hierarchy !== 'object') {
      return false
    }

    const related = collection.hierarchy.relatedCollections?.[collectionSlug]

    return related !== undefined && related.hasMany === false
  })?.slug
