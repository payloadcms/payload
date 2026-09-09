import { s3Storage } from '@payloadcms/storage-s3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser } from '../../credentials.js'
import { Media } from '../collections/Media.js'
import { MediaWithPrefix } from '../collections/MediaWithPrefix.js'
import { Users } from '../collections/Users.js'
import {
  mediaHeaderOnlySlug,
  mediaHeaderOnlyWithSizesSlug,
  mediaSlug,
  mediaWithPrefixSlug,
} from '../shared.js'
import { MediaContainer } from './collections/MediaContainer.js'
import { MediaHeaderOnly } from './collections/MediaHeaderOnly.js'
import { MediaHeaderOnlyWithSizes } from './collections/MediaHeaderOnlyWithSizes.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({
  path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated'),
})

export default buildConfigWithDefaults({
  suite: 'storage-s3-client-uploads',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname, '..'),
      },
    },
    collections: [
      Media,
      MediaWithPrefix,
      MediaContainer,
      MediaHeaderOnly,
      MediaHeaderOnlyWithSizes,
      Users,
    ],
    storage: [
      s3Storage({
        bucket: process.env.S3_BUCKET!,
        clientUploads: {
          access: ({ req }) => (req.headers.get('x-disallow-access') ? false : true),
        },
        collections: {
          [mediaHeaderOnlySlug]: true,
          [mediaHeaderOnlyWithSizesSlug]: true,
          [mediaSlug]: true,
          [mediaWithPrefixSlug]: {
            prefix: 'test-prefix',
          },
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
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
