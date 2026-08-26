import { s3Storage } from '@payloadcms/storage-s3'
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
import { MediaWithSignedDownloads } from './collections/MediaWithSignedDownloads.js'
import { Users } from './collections/Users.js'
import {
  mediaSlug,
  mediaWithAlwaysInsertFieldsSlug,
  mediaWithDirectAccessSlug,
  mediaWithDynamicPrefixSlug,
  mediaWithPrefixSlug,
  mediaWithSignedDownloadsSlug,
  prefix,
} from './shared.js'
import { proveSourceHashTransformer } from './transformerFixtures.js'
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
  collections: [
    Media,
    MediaWithAlwaysInsertFields,
    MediaWithDirectAccess,
    MediaWithDynamicPrefix,
    MediaWithPrefix,
    MediaWithSignedDownloads,
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
    s3Storage({
      collections: {
        [mediaSlug]: true,
        [mediaWithDirectAccessSlug]: {
          disablePayloadAccessControl: true,
        },
        [mediaWithDynamicPrefixSlug]: true,
        [mediaWithPrefixSlug]: {
          prefix,
        },
        [mediaWithSignedDownloadsSlug]: {
          signedDownloads: {
            shouldUseSignedURL: (args) => {
              return args.req.headers.get('X-Disable-Signed-URL') !== 'true'
            },
          },
        },
      },
      bucket: process.env.S3_BUCKET!,
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
    // Test alwaysInsertFields with enabled: false
    s3Storage({
      alwaysInsertFields: true,
      collections: {
        [mediaWithAlwaysInsertFieldsSlug]: {
          prefix: '',
        },
      },
      bucket: process.env.S3_BUCKET!,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        region: process.env.S3_REGION,
      },
      enabled: false,
    }),
  ],
  upload: {
    limits: {
      fileSize: 1_000_000, // 1MB
    },
    transformers: [
      proveSourceHashTransformer,
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
