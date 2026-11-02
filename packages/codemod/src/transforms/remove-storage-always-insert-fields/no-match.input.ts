import { s3Storage as payloadS3Storage } from '@payloadcms/storage-s3'

const options = {
  alwaysInsertFields: true,
  bucket: 'media',
  collections: { media: true },
}

const s3Storage = (value: typeof options) => value

export const indirectStorage = payloadS3Storage(options)
export const unrelatedStorage = s3Storage({
  alwaysInsertFields: true,
  bucket: 'media',
  collections: { media: true },
})
export const spreadBeforeProperty = payloadS3Storage({
  ...options,
  alwaysInsertFields: false,
})
export const spreadAfterProperty = payloadS3Storage({
  alwaysInsertFields: false,
  ...options,
})
