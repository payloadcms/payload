import type { CollectionConfig } from 'payload'

export const isAzureClientUploadAllowed = (collection: CollectionConfig | undefined): boolean =>
  Boolean(
    collection?.upload &&
      typeof collection.upload === 'object' &&
      collection.upload.allowRestrictedFileTypes === true,
  )
