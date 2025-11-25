import { s3Storage } from '@payloadcms/storage-s3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { MediaWithSignedDownloads } from './collections/MediaWithSignedDownloads.js'
import { Users } from './collections/Users.js'
import { mediaSlug, mediaWithPrefixSlug, mediaWithSignedDownloadsSlug, prefix } from './shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let uploadOptions

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, './.env.emulated'),
})

console.log(process.env.S3_BUCKET, process.env.S3_SECRET_ACCESS_KEY)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Media, MediaWithPrefix, MediaWithSignedDownloads, Users],
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
        [mediaSlug]: {
          // cacheControl: 'max-age=31536000, public',
          disablePayloadAccessControl: true,
        },
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
      clientUploads: true,

      config: {
        endpoint: 'https://nbg1.your-objectstorage.com',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        region: 'nbg1',
        // forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        // region: process.env.S3_REGION,
      },
    }),
  ],
  upload: uploadOptions,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
