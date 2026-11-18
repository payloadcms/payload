import type { SanitizedCollectionConfig, SelectType } from 'payload'

import { appendUploadSelectFields } from 'payload/shared'

/** Custom thumbnail callbacks can depend on any configured upload field. */
export function getDocumentThumbnailSelect({
  collectionConfig,
  select = {},
}: {
  collectionConfig: SanitizedCollectionConfig
  select?: SelectType
}): SelectType {
  const thumbnailSelect = { ...select }

  appendUploadSelectFields({ collectionConfig, select: thumbnailSelect })

  if (collectionConfig.upload) {
    thumbnailSelect.url = true
  }

  if (collectionConfig.upload && typeof collectionConfig.upload.adminThumbnail === 'function') {
    for (const field of collectionConfig.flattenedFields) {
      thumbnailSelect[field.name] = true
    }
  }

  return thumbnailSelect
}
