import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser } from '../../credentials.js'
import { Media } from '../collections/Media.js'
import { MediaWithCompositePrefixes } from '../collections/MediaWithCompositePrefixes.js'
import { Users } from '../collections/Users.js'
import { collectionPrefix, mediaSlug, mediaWithCompositePrefixesSlug } from '../shared.js'
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
  collections: [Media, MediaContainer, MediaWithCompositePrefixes, Users],
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
      clientUploads: {
        access: ({ req }) => (req.headers.get('x-disallow-access') ? false : true),
      },
      collections: {
        [mediaSlug]: true,
        [mediaWithCompositePrefixesSlug]: {
          prefix: collectionPrefix,
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
      useCompositePrefixes: true,
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
