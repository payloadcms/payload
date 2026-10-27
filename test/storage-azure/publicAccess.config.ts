import type { CollectionConfig } from 'payload'

import { azureStorage } from '@payloadcms/storage-azure'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Users } from './collections/Users.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, '../plugin-cloud-storage/.env.emulated'),
})

// Unique names force a fresh provision each run; a leftover public container
// would otherwise mask a private-default regression.
const runId = Date.now()

export const privateMediaSlug = 'private-media'
export const publicMediaSlug = 'public-media'
export const privateContainerName = `azure-private-default-${runId}`
export const publicContainerName = `azure-public-optin-${runId}`
export const azureBaseURL = process.env.AZURE_STORAGE_ACCOUNT_BASEURL!
export const azureConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!

const uploadCollection = (slug: string): CollectionConfig => ({
  slug,
  fields: [],
  upload: {
    disableLocalStorage: true,
  },
})

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [uploadCollection(privateMediaSlug), uploadCollection(publicMediaSlug), Users],
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
    // No containerAccess: the plugin must create a private container.
    azureStorage({
      allowContainerCreate: true,
      baseURL: azureBaseURL,
      collections: { [privateMediaSlug]: true },
      connectionString: azureConnectionString,
      containerName: privateContainerName,
    }),
    // Explicit opt-in: the operator deliberately makes the container public.
    azureStorage({
      allowContainerCreate: true,
      baseURL: azureBaseURL,
      collections: { [publicMediaSlug]: true },
      connectionString: azureConnectionString,
      containerAccess: 'blob',
      containerName: publicContainerName,
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
