import type { StorageOptions } from '@google-cloud/storage'
import type {
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, StorageAdapter, UploadCollectionSlug } from 'payload'

import { Storage } from '@google-cloud/storage'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

import { createGcsAdapter } from './adapter.js'

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
   * Upload directly to GCS instead of through Payload. You must allow CORS PUT requests from your website.
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

type GcsStorageFactory = (gcsStorageArgs: GcsStorageOptions) => StorageAdapter

const gcsClients = new Map<string, Storage>()

export const gcsStorage: GcsStorageFactory = (
  gcsStorageOptions: GcsStorageOptions,
): StorageAdapter => ({
  name: 'gcs',
  collections: Object.keys(gcsStorageOptions.collections),
  init: (incomingConfig: Config): Config => {
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
  },
})
