import { uploadthingStorage } from '@payloadcms/storage-uploadthing'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '@test-utils/buildConfigWithDefaults.js'
import { devUser } from '@test-utils/credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import { mediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load test env creds
dotenv.config({
  path: path.resolve(dirname, './.env'),
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
    uploadthingStorage({
      collections: {
        [mediaSlug]: true,
      },
      options: {
        apiKey: process.env.UPLOADTHING_SECRET,
        acl: 'public-read',
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
