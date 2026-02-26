import type { StorageOptions } from '@google-cloud/storage'
import type {
  Adapter,
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { Storage } from '@google-cloud/storage'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import { getGenerateSignedURLHandler } from './generateSignedURL.js'
import { getGenerateURL } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'

export interface GcsStorageOptions {
  acl?: 'Private' | 'Public'

  /**
   * When enabled, fields (like the prefix field) will always be inserted into
   * the collection schema regardless of whether the plugin is enabled. This
   * ensures a consistent schema across all environments.
   *
   * This will be enabled by default in Payload v4.
   *
   * @default false
   */
  alwaysInsertFields?: boolean

  /**
   * The name of the bucket to use.
   */
  bucket: string
  /**
   * Optional cache key to identify the GCS storage client instance.
   * If not provided, a default key will be used.
   *
   * @default `gcs:containerName`
   */
  clientCacheKey?: string
  /**
   * Do uploads directly on the client to bypass limits on Vercel. You must allow CORS PUT method for the bucket to your website.
   */
  clientUploads?: ClientUploadsConfig
  /**
   * Collection options to apply the S3 adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>
  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean

  /**
   * Google Cloud Storage client configuration.
   *
   * @see https://github.com/googleapis/nodejs-storage
   */
  options: StorageOptions
}

type GcsStoragePlugin = (gcsStorageArgs: GcsStorageOptions) => Plugin

const gcsClients = new Map<string, Storage>()

export const gcsStorage: GcsStoragePlugin =
  (gcsStorageOptions: GcsStorageOptions) =>
  (incomingConfig: Config): Config => {
    const cacheKey = gcsStorageOptions.clientCacheKey || `gcs:${gcsStorageOptions.bucket}`

    const getStorageClient = (): Storage => {
      if (gcsClients.has(cacheKey)) {
        return gcsClients.get(cacheKey)!
      }
      gcsClients.set(cacheKey, new Storage(gcsStorageOptions.options))

      return gcsClients.get(cacheKey)!
    }

    const adapter = gcsStorageInternal(getStorageClient, gcsStorageOptions)

    const isPluginDisabled = gcsStorageOptions.enabled === false

    initClientUploads({
      clientHandler: '@payloadcms/storage-gcs/client#GcsClientUploadHandler',
      collections: gcsStorageOptions.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(gcsStorageOptions.clientUploads),
      serverHandler: getGenerateSignedURLHandler({
        access:
          typeof gcsStorageOptions.clientUploads === 'object'
            ? gcsStorageOptions.clientUploads.access
            : undefined,
        bucket: gcsStorageOptions.bucket,
        collections: gcsStorageOptions.collections,
        getStorageClient,
      }),
      serverHandlerPath: '/storage-gcs-generate-signed-url',
    })

    if (isPluginDisabled) {
      // If alwaysInsertFields is true, still call cloudStoragePlugin to insert fields
      if (gcsStorageOptions.alwaysInsertFields) {
        // Build collections with adapter: null since plugin is disabled
        const collectionsWithoutAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
          gcsStorageOptions.collections,
        ).reduce(
          (acc, [slug, collOptions]) => ({
            ...acc,
            [slug]: {
              ...(collOptions === true ? {} : collOptions),
              adapter: null,
            },
          }),
          {} as Record<string, CollectionOptions>,
        )

        return cloudStoragePlugin({
          alwaysInsertFields: true,
          collections: collectionsWithoutAdapter,
          enabled: false,
        })(incomingConfig)
      }

      return incomingConfig
    }

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      gcsStorageOptions.collections,
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
      alwaysInsertFields: gcsStorageOptions.alwaysInsertFields,
      collections: collectionsWithAdapter,
    })(config)
  }

function gcsStorageInternal(
  getStorageClient: () => Storage,
  { acl, bucket, clientUploads }: GcsStorageOptions,
): Adapter {
  return ({ collection, prefix }): GeneratedAdapter => {
    return {
      name: 'gcs',
      clientUploads,
      generateURL: getGenerateURL({ bucket, getStorageClient }),
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
