import { azureStorage } from '@payloadcms/storage-azure'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithAlwaysInsertFields } from './collections/MediaWithAlwaysInsertFields.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import {
  mediaSlug,
  mediaWithAlwaysInsertFieldsSlug,
  mediaWithPrefixSlug,
  prefix,
} from './shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let uploadOptions

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, '../plugin-cloud-storage/.env.emulated'),
})

export default buildConfigWithDefaults({
  suite: 'storage-azure',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Media, MediaWithAlwaysInsertFields, MediaWithPrefix, Users],
    storage: [
      azureStorage({
        allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
        baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL!,
        clientUploads: true,
        collections: {
          [mediaSlug]: true,
          [mediaWithPrefixSlug]: {
            prefix,
          },
        },
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME!,
      }),
      // Plugin disabled: the prefix field should still be inserted by default
      azureStorage({
        allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
        baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL!,
        collections: {
          [mediaWithAlwaysInsertFieldsSlug]: {
            prefix: '',
          },
        },
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME!,
        enabled: false,
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: uploadOptions,
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
