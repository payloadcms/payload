import type { ClientCollectionConfig, FieldWithPathClient } from 'payload'

export const filterOutUploadFields = (
  collection: ClientCollectionConfig,
  fields: FieldWithPathClient[],
): FieldWithPathClient[] => {
  // List of reserved upload field names
  const baseUploadFieldNames = [
    'file',
    'mimeType',
    'thumbnailURL',
    'width',
    'height',
    'filesize',
    'filename',
    'url',
    'focalX',
    'focalY',
    'sizes',
  ]

  // Check if the collection is an uploads collection
  const isUploadsCollection = !!collection?.upload

  return fields.filter((field) => {
    if (!isUploadsCollection) {
      return true
    }
    return !baseUploadFieldNames.includes('name' in field && field.name)
  })
}
