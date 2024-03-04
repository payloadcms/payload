import * as AWS from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import path from 'path'

import type { Adapter } from '../../packages/plugin-cloud-storage/src/types'

import { cloudStorage } from '../../packages/plugin-cloud-storage/src'
import { azureBlobStorageAdapter } from '../../packages/plugin-cloud-storage/src/adapters/azure'
import { gcsAdapter } from '../../packages/plugin-cloud-storage/src/adapters/gcs'
import { s3Adapter } from '../../packages/plugin-cloud-storage/src/adapters/s3'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

let adapter: Adapter
let uploadOptions

dotenv.config({
  path: path.resolve(process.cwd(), './test/plugin-cloud-storage/.env.emulated'),
})

console.log(
  `Using plugin-cloud-storage adapter: ${process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER}`,
)

if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'azure') {
  adapter = azureBlobStorageAdapter({
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
    allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
    baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
  })
  // uploadOptions = {
  //   useTempFiles: true,
  // }
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

if (
  process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 's3' ||
  !process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER
) {
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

if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'r2') {
  adapter = s3Adapter({
    config: {
      endpoint: process.env.R2_ENDPOINT,
      forcePathStyle: process.env.R2_FORCE_PATH_STYLE === 'true',
      region: process.env.R2_REGION,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    },
    bucket: process.env.R2_BUCKET,
  })
}

export default buildConfigWithDefaults({
  collections: [Media, Users],
  upload: uploadOptions,
  plugins: [
    cloudStorage({
      collections: {
        media: {
          adapter,
        },
      },
    }),
  ],
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
  },
})
