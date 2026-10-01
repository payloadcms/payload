import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser } from '../../credentials.js'
import { Media } from '../collections/Media.js'
import { MediaWithPrefix } from '../collections/MediaWithPrefix.js'
import { Users } from '../collections/Users.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from '../shared.js'
import { ConvertedMedia } from './collections/ConvertedMedia.js'
import { MediaContainer } from './collections/MediaContainer.js'
import { convertedMediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({
  path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated'),
})

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname, '..'),
      },
    },
    collections: [
      {
        ...Media,
        upload: {
          ...(typeof Media.upload === 'object' ? Media.upload : {}),
          imageSizes: [{ name: 'square', height: 20, width: 30 }],
        },
      },
      ConvertedMedia,
      MediaWithPrefix,
      MediaContainer,
      Users,
    ],
    storage: [
      vercelBlobStorage({
        addRandomSuffix: true,
        clientUploads: {
          access: ({ req }) => (req.headers.get('x-disallow-access') ? false : true),
        },
        collections: {
          [mediaSlug]: true,
          [convertedMediaSlug]: true,
          [mediaWithPrefixSlug]: {
            prefix,
          },
        },
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })
  },
  suite: 'storage-vercel-blob-client-uploads',
})
