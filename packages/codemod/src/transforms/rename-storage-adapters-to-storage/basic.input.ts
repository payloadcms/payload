import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  storageAdapters: [
    s3Storage({
      bucket: process.env.S3_BUCKET,
      collections: { media: true },
      config: { region: process.env.S3_REGION },
    }),
  ],
})
