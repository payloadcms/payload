import type { SanitizedCollectionConfig } from '../collections/config/types.js'

export function canReadNestedDocsTree({
  collectionConfig,
}: {
  collectionConfig: SanitizedCollectionConfig
}): boolean {
  if (!collectionConfig.nestedDocs || !collectionConfig.hierarchy) {
    return false
  }

  const parentFieldName = collectionConfig.hierarchy.parentFieldName
  const parentField = collectionConfig.flattenedFields.find(
    (field) => field.name === parentFieldName,
  )

  return !parentField?.access?.read
}
