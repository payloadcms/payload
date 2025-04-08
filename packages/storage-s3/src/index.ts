import type {
  Adapter,
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { NodeHttpHandlerOptions } from '@smithy/node-http-handler'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import * as AWS from '@aws-sdk/client-s3'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import { getGenerateSignedURLHandler } from './generateSignedURL.js'
import { getGenerateURL } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'

export type S3StorageOptions = {
  /**
   * Access control list for uploaded files.
   */

  acl?: 'private' | 'public-read'
  /**
   * Bucket name to upload files to.
   *
   * Must follow [AWS S3 bucket naming conventions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html).
   */

  bucket: string

  /**
   * Do uploads directly on the client to bypass limits on Vercel. You must allow CORS PUT method for the bucket to your website.
   */
  clientUploads?: ClientUploadsConfig
  /**
   * Collection options to apply the S3 adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * AWS S3 client configuration. Highly dependent on your AWS setup.
   *
   * [AWS.S3ClientConfig Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html)
   */
  config: AWS.S3ClientConfig

  /**
   * Whether or not to disable local storage
   *
   * @default true
   */
  disableLocalStorage?: boolean

  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean
}

type S3StoragePlugin = (storageS3Args: S3StorageOptions) => Plugin

let storageClient: AWS.S3 | null = null

const defaultRequestHandlerOpts: NodeHttpHandlerOptions = {
  httpAgent: {
    keepAlive: true,
    maxSockets: 100,
  },
  httpsAgent: {
    keepAlive: true,
    maxSockets: 100,
  },
}

export const s3Storage: S3StoragePlugin =
  (s3StorageOptions: S3StorageOptions) =>
  (incomingConfig: Config): Config => {
    const getStorageClient: () => AWS.S3 = () => {
      if (storageClient) {
        return storageClient
      }

      storageClient = new AWS.S3({
        requestHandler: defaultRequestHandlerOpts,
        ...(s3StorageOptions.config ?? {}),
      })
      return storageClient
    }

    const isPluginDisabled = s3StorageOptions.enabled === false

    initClientUploads({
      clientHandler: '@payloadcms/storage-s3/client#S3ClientUploadHandler',
      collections: s3StorageOptions.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(s3StorageOptions.clientUploads),
      serverHandler: getGenerateSignedURLHandler({
        access:
          typeof s3StorageOptions.clientUploads === 'object'
            ? s3StorageOptions.clientUploads.access
            : undefined,
        acl: s3StorageOptions.acl,
        bucket: s3StorageOptions.bucket,
        collections: s3StorageOptions.collections,
        getStorageClient,
      }),
      serverHandlerPath: '/storage-s3-generate-signed-url',
    })

    if (isPluginDisabled) {
      return incomingConfig
    }

    const adapter = s3StorageInternal(getStorageClient, s3StorageOptions)

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      s3StorageOptions.collections,
    ).reduce(
      (acc, [slug, collOptions]) => ({
        ...acc,
        [slug]: {
          ...(collOptions === true ? {} : collOptions),
          adapter,
        },
      }),
      {} as Record<string, CollectionOptions>,
    )

    // Set disableLocalStorage: true for collections specified in the plugin options
    const config = {
      ...incomingConfig,
      collections: (incomingConfig.collections || []).map((collection) => {
        if (!collectionsWithAdapter[collection.slug]) {
          return collection
        }

        return {
          ...collection,
          upload: {
            ...(typeof collection.upload === 'object' ? collection.upload : {}),
            disableLocalStorage: true,
          },
        }
      }),
    }

    return cloudStoragePlugin({
      collections: collectionsWithAdapter,
    })(config)
  }

function s3StorageInternal(
  getStorageClient: () => AWS.S3,
  { acl, bucket, clientUploads, config = {} }: S3StorageOptions,
): Adapter {
  return ({ collection, prefix }): GeneratedAdapter => {
    return {
      name: 's3',
      clientUploads,
      generateURL: getGenerateURL({ bucket, config }),
      handleDelete: getHandleDelete({ bucket, getStorageClient }),
      handleUpload: getHandleUpload({
        acl,
        bucket,
        collection,
        getStorageClient,
        prefix,
      }),
      staticHandler: getHandler({ bucket, collection, getStorageClient }),
    }
  }
}
