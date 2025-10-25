/**
 * Validates collection-specific data for resource creation
 */
export function validateCollectionData(
  collection: string,
  data: Record<string, unknown>,
  availableCollections: string[],
): null | string {
  // Check if collection exists
  if (!availableCollections.includes(collection)) {
    return `Unknown collection: ${collection}. Available collections: ${availableCollections.join(', ')}`
  }

  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return `Collection "${collection}" requires data to be provided`
  }

  return null
}

/**
 * Checks if a collection slug is valid
 */
export function validateCollectionSlug(
  collection: string,
  collections: Partial<Record<string, true>>,
) {
  const collectionSlugs = Object.keys(collections)
  if (!collectionSlugs.includes(collection)) {
    return `Collection "${collection}" is not valid`
  }
}
