import { azureStorage } from '@payloadcms/storage-azure'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser } from '../../credentials.js'
import { Users } from '../collections/Users.js'
import { videosMissingContainerSlug, videosSlug } from '../shared.js'
import { Videos } from './collections/Videos.js'
import { VideosMissingContainer } from './collections/VideosMissingContainer.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({
  path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated'),
})

export const uploadSessionsContainerName = 'az-upload-sessions'

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname, '..'),
      },
    },
    collections: [Videos, VideosMissingContainer, Users],
    storage: [
      azureStorage({
        allowContainerCreate: true,
        baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL!,
        clientUploads: {
          access: ({ req }) => !req.headers.get('x-disallow-access'),
        },
        collections: {
          [videosSlug]: true,
        },
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
        containerName: uploadSessionsContainerName,
      }),
      azureStorage({
        allowContainerCreate: false,
        baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL!,
        clientUploads: true,
        collections: {
          [videosMissingContainerSlug]: true,
        },
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
        containerName: 'az-upload-sessions-missing',
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
  suite: 'storage-azure-upload-sessions',
})
