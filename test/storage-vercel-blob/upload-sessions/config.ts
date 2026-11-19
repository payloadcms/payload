import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser } from '../../credentials.js'
import { Users } from '../collections/Users.js'
import { uploadSessionsPrefix, videosSlug } from '../shared.js'
import { Videos } from './collections/Videos.js'

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
    collections: [Videos, Users],
    storage: [
      vercelBlobStorage({
        clientUploads: {
          access: ({ req }) => !req.headers.get('x-disallow-access'),
        },
        collections: {
          // The emulator has one store, so a prefix keeps this suite's blobs apart.
          [videosSlug]: { prefix: uploadSessionsPrefix },
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
      data: { email: devUser.email, password: devUser.password },
      overrideAccess: true,
    })
  },
  suite: 'storage-vercel-blob-upload-sessions',
})
