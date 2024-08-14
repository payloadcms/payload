import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from './shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let uploadOptions

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
  collections: [Media, MediaWithPrefix, Users],
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
    vercelBlobStorage({
      collections: {
        [mediaSlug]: true,
        [mediaWithPrefixSlug]: {
          prefix,
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  upload: uploadOptions,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
