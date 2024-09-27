import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { azureBlobStorageAdapter } from '@payloadcms/plugin-cloud-storage/azure'
import { gcsAdapter } from '@payloadcms/plugin-cloud-storage/gcs'
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '@test-utils/buildConfigWithDefaults.js'
import { devUser } from '@test-utils/credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from './shared.js'
import { createTestBucket } from './utils.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let adapter: Adapter
let uploadOptions

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, './.env.emulated'),
})

if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'azure') {
  adapter = azureBlobStorageAdapter({
    allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
    baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
  })
  // uploadOptions = {
  //   useTempFiles: true,
  // }
}

if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'gcs') {
  adapter = gcsAdapter({
    bucket: process.env.GCS_BUCKET,
    options: {
      apiEndpoint: process.env.GCS_ENDPOINT,
      projectId: process.env.GCS_PROJECT_ID,
    },
  })
}

if (
  process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 's3' ||
  !process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER
) {
  // The s3 adapter supports using temp files for uploads
  uploadOptions = {
    useTempFiles: true,
  }

  adapter = s3Adapter({
    bucket: process.env.S3_BUCKET,
    config: {
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      region: process.env.S3_REGION,
    },
  })
}

if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'r2') {
  adapter = s3Adapter({
    bucket: process.env.R2_BUCKET,
    config: {
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      endpoint: process.env.R2_ENDPOINT,
      forcePathStyle: process.env.R2_FORCE_PATH_STYLE === 'true',
      region: process.env.R2_REGION,
    },
  })
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Media, MediaWithPrefix, Users],
  onInit: async (payload) => {
    /*const client = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    })

    const makeBucketRes = await client.send(
      new AWS.CreateBucketCommand({ Bucket: 'payload-bucket' }),
    )

    if (makeBucketRes.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to create bucket. ${makeBucketRes.$metadata.httpStatusCode}`)
    }*/

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await createTestBucket()

    payload.logger.info(
      `Using plugin-cloud-storage adapter: ${process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER}`,
    )
  },
  plugins: [
    cloudStoragePlugin({
      collections: {
        [mediaSlug]: {
          adapter,
        },
        [mediaWithPrefixSlug]: {
          adapter,
          prefix,
        },
      },
    }),
  ],
  upload: uploadOptions,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
