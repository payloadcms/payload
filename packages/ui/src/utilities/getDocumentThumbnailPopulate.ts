import type { PopulateType, SanitizedCollectionConfig } from 'payload'

import { getDocumentThumbnailSelect } from './getDocumentThumbnailSelect.js'

/** Select thumbnail metadata independently of the upload collection's defaultPopulate. */
export function getDocumentThumbnailPopulate({
  collectionConfig,
  collections,
}: {
  collectionConfig: SanitizedCollectionConfig
  collections: SanitizedCollectionConfig[]
}): PopulateType | undefined {
  const thumbnailField = collectionConfig.flattenedFields.find(
    (field) => field.name === collectionConfig.admin.useAsThumbnail && field.type === 'upload',
  )

  if (!thumbnailField || !('relationTo' in thumbnailField)) {
    return undefined
  }
  const relatedSlugs = Array.isArray(thumbnailField.relationTo)
    ? thumbnailField.relationTo
    : [thumbnailField.relationTo]
  const populate: PopulateType = {}

  for (const slug of relatedSlugs) {
    const relatedCollectionConfig = collections.find((collection) => collection.slug === slug)

    if (relatedCollectionConfig) {
      populate[slug] = getDocumentThumbnailSelect({ collectionConfig: relatedCollectionConfig })
    }
  }

  return populate
}
