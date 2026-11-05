import { s3Storage as createS3Storage } from '@payloadcms/storage-s3'

const alwaysInsertFields = true

export const storage = createS3Storage({
  alwaysInsertFields,
  bucket: 'media',
  collections: { media: true },
})
