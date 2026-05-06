import { azureStorage } from '@payloadcms/storage-azure'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser } from '../../credentials.js'
import { Media } from '../collections/Media.js'
import { MediaWithPrefix } from '../collections/MediaWithPrefix.js'
import { Users } from '../collections/Users.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from '../shared.js'
import { MediaWithDocPrefix, mediaWithDocPrefixSlug } from './collections/MediaWithDocPrefix.js'

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
  collections: [Media, MediaWithPrefix, MediaWithDocPrefix, Users],
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
    azureStorage({
      collections: {
        [mediaSlug]: true,
        [mediaWithPrefixSlug]: {
          prefix,
        },
        // Configure a collection-level prefix on this slug to test that
        // a custom `prefix.defaultValue` does override the static prefix
        [mediaWithDocPrefixSlug]: {
          prefix: 'docprefix-collection',
        },
      },
      allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
      baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL!,
      clientUploads: true,
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME!,
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
