import type { ClientCollectionConfig } from 'payload'

export function hasHierarchyContents({
  collection,
}: {
  collection: Pick<ClientCollectionConfig, 'hierarchy'>
}): boolean {
  return (
    typeof collection.hierarchy === 'object' &&
    Object.keys(collection.hierarchy.relatedCollections).length > 0
  )
}
