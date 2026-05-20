import { searchPlugin } from '@payloadcms/plugin-search'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  plugins: [
    searchPlugin({
      collections: ['posts'],
    }),
    s3Storage({
      bucket: process.env.S3_BUCKET,
      collections: { media: true },
      config: { region: process.env.S3_REGION },
    }),
  ],
})
