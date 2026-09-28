import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { azureStorage } from '@payloadcms/storage-azure'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { r2Storage } from '@payloadcms/storage-r2'
import { s3Storage } from '@payloadcms/storage-s3'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export const storage = [
  cloudStoragePlugin({
    collections: { media: { adapter: null } },
  }),
  azureStorage({
    collections: { media: true },
    containerName: 'media',
  }),
  gcsStorage({
    bucket: 'media',
    collections: { media: true },
  }),
  r2Storage({
    accountId: 'account',
    bucket: 'media',
    collections: { media: true },
  }),
  s3Storage({
    bucket: 'media',
    collections: { media: true },
  }),
  vercelBlobStorage({
    collections: { media: true },
    token: 'token',
  }),
]
