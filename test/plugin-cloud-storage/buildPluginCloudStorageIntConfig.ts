import type { S3StorageOptions } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { azureStorage } from '@payloadcms/storage-azure'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { s3Storage } from '@payloadcms/storage-s3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithCompositePrefixes } from './collections/MediaWithCompositePrefixes.js'
import { MediaWithCustomURL } from './collections/MediaWithCustomURL.js'
import { MediaWithGenerateFileURL } from './collections/MediaWithGenerateFileURL.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { RestrictedMedia } from './collections/RestrictedMedia.js'
import { TestMetadata } from './collections/TestMetadata.js'
import { Users } from './collections/Users.js'
import {
  collectionPrefix,
  mediaSlug,
  mediaWithCompositePrefixesSlug,
  mediaWithCustomURLSlug,
  mediaWithGenerateFileURLSlug,
  mediaWithPrefixSlug,
  prefix,
  restrictedMediaSlug,
  testMetadataSlug,
} from './shared.js'
import { createTestBucket } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export type BuildPluginCloudStorageIntConfigArgs = {
  /** When false, S3 uses non-composite prefix resolution (single stored prefix segment; pre-composite behavior). */
  useCompositePrefixes: boolean
}

export function buildPluginCloudStorageIntConfig({
  useCompositePrefixes,
}: BuildPluginCloudStorageIntConfigArgs) {
  let storagePlugin: Plugin = {} as Plugin
  let uploadOptions

  dotenv.config({
    path: path.resolve(dirname, './.env.emulated'),
  })

  if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'azure') {
    storagePlugin = azureStorage({
      allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
      baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL!,
      collections: {
        [mediaSlug]: true,
        [mediaWithPrefixSlug]: {
          prefix,
        },
        [restrictedMediaSlug]: true,
      },
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME!,
    })
  }

  if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'gcs') {
    storagePlugin = gcsStorage({
      bucket: process.env.GCS_BUCKET!,
      collections: {
        [mediaSlug]: true,
        [mediaWithPrefixSlug]: {
          prefix,
        },
        [restrictedMediaSlug]: true,
      },
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
    uploadOptions = {
      useTempFiles: true,
    }

    storagePlugin = s3Storage({
      bucket: process.env.S3_BUCKET ?? '',
      collections: {
        [mediaSlug]: true,
        [mediaWithCompositePrefixesSlug]: {
          prefix: collectionPrefix,
        },
        [mediaWithCustomURLSlug]: {
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            filename
              ? `https://test-cdn.example.com/${prefix}/${encodeURIComponent(filename)}`
              : null,
          prefix,
        } as S3StorageOptions['collections'][keyof S3StorageOptions['collections']],
        [mediaWithGenerateFileURLSlug]: {
          generateFileURL: ({ filename, prefix }) =>
            filename
              ? `https://cdn-proxied.example.com/${prefix}/${encodeURIComponent(filename)}`
              : null,
          prefix,
        } as S3StorageOptions['collections'][keyof S3StorageOptions['collections']],
        [mediaWithPrefixSlug]: {
          prefix,
        },
        [restrictedMediaSlug]: true,
      },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        region: process.env.S3_REGION,
      },
      useCompositePrefixes,
    })
  }

  if (process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER === 'r2') {
    storagePlugin = s3Storage({
      bucket: process.env.R2_BUCKET ?? '',
      collections: {
        [mediaSlug]: true,
        [mediaWithPrefixSlug]: {
          prefix,
        },
      },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        region: process.env.S3_REGION,
      },
    })
  }

  const testMetadataPlugin = cloudStoragePlugin({
    collections: {
      [testMetadataSlug]: {
        adapter: () => ({
          name: 'test-metadata-adapter',
          handleDelete: () => Promise.resolve(),
          handleUpload: ({ data, file }) => {
            const metadata = {
              ...data,
              bucketName: 'test-bucket',
              customStorageId: `storage-${Date.now()}`,
              objectKey: data.filename || file.filename,
              processingStatus: 'completed',
              storageProvider: 'test-adapter',
              uploadTimestamp: new Date().toISOString(),
              uploadVersion: '1.0.0',
            }
            return metadata
          },
          staticHandler: () => new Response('Not found', { status: 404 }),
        }),
      },
    },
  })

  return buildConfigWithDefaults({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      Media,
      MediaWithCompositePrefixes,
      MediaWithCustomURL,
      MediaWithGenerateFileURL,
      MediaWithPrefix,
      RestrictedMedia,
      TestMetadata,
      Users,
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

      await createTestBucket()

      payload.logger.info(
        `Using plugin-cloud-storage adapter: ${process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER}`,
      )
    },
    plugins: [storagePlugin, testMetadataPlugin],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: uploadOptions,
  })
}
