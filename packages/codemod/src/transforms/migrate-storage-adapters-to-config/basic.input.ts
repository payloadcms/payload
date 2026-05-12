import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  plugins: [
    s3Storage({
      bucket: process.env.S3_BUCKET,
      collections: { media: true },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        region: process.env.S3_REGION,
      },
    }),
  ],
})
