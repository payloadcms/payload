import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { azureStorage } from '@payloadcms/storage-azure'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { r2Storage } from '@payloadcms/storage-r2'
import { s3Storage } from '@payloadcms/storage-s3'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export const storage = [
  cloudStoragePlugin({
    alwaysInsertFields: true,
    collections: { media: { adapter: null } },
  }),
  azureStorage({
    alwaysInsertFields: false,
    collections: { media: true },
    containerName: 'media',
  }),
  gcsStorage({
    alwaysInsertFields: process.env.ALWAYS_INSERT_FIELDS === 'true',
    bucket: 'media',
    collections: { media: true },
  }),
  r2Storage({
    accountId: 'account',
    alwaysInsertFields: true,
    bucket: 'media',
    collections: { media: true },
  }),
  s3Storage({
    alwaysInsertFields: true,
    bucket: 'media',
    collections: { media: true },
  }),
  vercelBlobStorage({
    alwaysInsertFields: true,
    collections: { media: true },
    token: 'token',
  }),
]
