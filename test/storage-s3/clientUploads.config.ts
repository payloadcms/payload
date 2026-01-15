import { s3Storage } from '@payloadcms/storage-s3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { Users } from './collections/Users.js'
import { mediaSlug } from './shared.js'
import { MB } from './test-utils.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, '../plugin-cloud-storage/.env.emulated'),
})

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Media, Users],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  plugins: [
    s3Storage({
      collections: {
        [mediaSlug]: true,
      },
      bucket: process.env.S3_BUCKET!,
      clientUploads: {
        access: ({ req }) => (req.headers.get('x-disallow-access') ? false : true),
      },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        region: process.env.S3_REGION,
      },
    }),
  ],
  upload: {
    limits: {
      fileSize: MB(10),
    }, // 10 mb
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
