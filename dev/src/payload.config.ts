import { buildConfig } from 'payload/config'
import path from 'path'
import Users from './collections/Users'
import { cloudStorage } from '../../src'
import { s3Adapter } from '../../src/adapters/s3'
import { gcsAdapter } from '../../src/adapters/gcs'
import { azureBlobStorageAdapter } from '../../src/adapters/azure'
import type { Adapter } from '../../src/types'
import { Media } from './collections/Media'

let adapter: Adapter
let uploadOptions

if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'azure') {
  adapter = azureBlobStorageAdapter({
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
    allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
    baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
  })
}

if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 's3') {
  // The s3 adapter supports using temp files for uploads
  uploadOptions = {
    useTempFiles: true,
  }

  adapter = s3Adapter({
    config: {
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    },
    bucket: process.env.S3_BUCKET,
  })
}

if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'gcs') {
  adapter = gcsAdapter({
    options: {
      apiEndpoint: process.env.GCS_ENDPOINT,
      projectId: process.env.GCS_PROJECT_ID,
    },
    bucket: process.env.GCS_BUCKET,
  })
}

export default buildConfig({
  serverURL: 'http://localhost:3000',
  collections: [Media, Users],
  upload: uploadOptions,
  admin: {
    // NOTE - these webpack extensions are only required
    // for development of this plugin.
    // No need to use these aliases within your own projects.
    webpack: config => {
      const newConfig = {
        ...config,
        resolve: {
          ...(config.resolve || {}),
          alias: {
            ...(config.resolve.alias || {}),
            react: path.resolve(__dirname, '../node_modules/react'),
            '@azure/storage-blob': path.resolve(__dirname, '../../src/adapters/azure/mock.js'),
            '@aws-sdk/client-s3': path.resolve(__dirname, '../../src/adapters/s3/mock.js'),
            '@google-cloud/storage': path.resolve(__dirname, '../../src/adapters/gcs/mock.js'),
          },
        },
      }
      return newConfig
    },
  },
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  plugins: [
    // @ts-expect-error
    cloudStorage({
      collections: {
        media: {
          adapter,
        },
      },
    }),
  ],
  onInit: async payload => {
    const users = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (!users.docs.length) {
      await payload.create({
        collection: 'users',
        data: {
          email: 'dev@payloadcms.com',
          password: 'test',
        },
      })
    }
  },
})
