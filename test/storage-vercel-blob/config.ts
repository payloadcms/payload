import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithAlwaysInsertFields } from './collections/MediaWithAlwaysInsertFields.js'
import { MediaWithDirectAccess } from './collections/MediaWithDirectAccess.js'
import { MediaWithDynamicPrefix } from './collections/MediaWithDynamicPrefix.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import {
  mediaSlug,
  mediaWithAlwaysInsertFieldsSlug,
  mediaWithDirectAccessSlug,
  mediaWithDynamicPrefixSlug,
  mediaWithPrefixSlug,
  prefix,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({
  path: path.resolve(dirname, '../plugin-cloud-storage/.env.emulated'),
})

// TODO: Load this into CI or have shared creds
dotenv.config({
  path: path.resolve(dirname, '.env'),
})

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Media,
    MediaWithAlwaysInsertFields,
    MediaWithDirectAccess,
    MediaWithDynamicPrefix,
    MediaWithPrefix,
    Users,
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  storage: [
    vercelBlobStorage({
      collections: {
        [mediaSlug]: true,
        [mediaWithDirectAccessSlug]: {
          disablePayloadAccessControl: true,
        },
        [mediaWithDynamicPrefixSlug]: true,
        [mediaWithPrefixSlug]: {
          prefix,
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
    // Test alwaysInsertFields with enabled: false
    vercelBlobStorage({
      alwaysInsertFields: true,
      collections: {
        [mediaWithAlwaysInsertFieldsSlug]: {
          prefix: '',
        },
      },
      enabled: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  upload: {
    transformers: [
      sharpTransformer({
        collections: {
          [mediaSlug]: {
            imageSizes: [
              { height: 400, width: 400, crop: 'center', name: 'square' },
              { width: 900, height: 450, crop: 'center', name: 'sixteenByNineMedium' },
            ],
            resizeOptions: {
              position: 'center',
              width: 200,
              height: 200,
            },
          },
          [mediaWithDirectAccessSlug]: {
            imageSizes: [{ name: 'thumbnail', width: 400, height: 300, crop: 'center' }],
          },
        },
      }),
    ],
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
