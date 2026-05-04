import type { StorageOptions } from '@google-cloud/storage'
import type {
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { Storage } from '@google-cloud/storage'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import { createGcsAdapter } from './adapter.js'
import { getGenerateSignedURLHandler } from './generateSignedURL.js'

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

  /**
   * When true, the collection-level prefix and document-level prefix are combined
   * (compositional). When false (default), document prefix overrides collection
   * prefix entirely.
   *
   * Example:
   * - collection prefix: `collection-prefix/`
   * - document prefix: `document-prefix/`
   * - resulting prefix with useCompositePrefixes=true: `collection-prefix/document-prefix/`
   * - resulting prefix with useCompositePrefixes=false: `document-prefix/`
   *
   * @default false
   */
  useCompositePrefixes?: boolean
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

    const adapter = createGcsAdapter({
      acl: gcsStorageOptions.acl,
      bucket: gcsStorageOptions.bucket,
      clientUploads: gcsStorageOptions.clientUploads,
      getStorageClient,
      useCompositePrefixes: gcsStorageOptions.useCompositePrefixes,
    })

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
        useCompositePrefixes: gcsStorageOptions.useCompositePrefixes,
      }),
      serverHandlerPath: '/storage-gcs-generate-signed-url',
    })

    if (isPluginDisabled) {
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
      useCompositePrefixes: gcsStorageOptions.useCompositePrefixes,
    })(config)
  }
