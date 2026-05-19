import { s3Storage } from '@payloadcms/storage-s3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser } from '../../credentials.js'
import { Media } from '../collections/Media.js'
import { MediaWithPrefix } from '../collections/MediaWithPrefix.js'
import { Users } from '../collections/Users.js'
import { mediaSlug, mediaWithPrefixSlug } from '../shared.js'
import { MediaContainer } from './collections/MediaContainer.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({
  path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated'),
})

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, '..'),
    },
  },
  collections: [Media, MediaWithPrefix, MediaContainer, Users],
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
        [mediaWithPrefixSlug]: {
          prefix: 'test-prefix',
        },
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
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
