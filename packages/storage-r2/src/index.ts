import type {
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, StorageAdapter, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

import type { R2Bucket } from './types.js'

import { createR2Adapter } from './adapter.js'

export interface R2StorageOptions {
  bucket: R2Bucket
  /**
   * Upload files in chunks through Payload before document creation.
   */
  clientUploads?: ClientUploadsConfig
  /**
   * Collection options to apply the R2 adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>
  enabled?: boolean
  /**
   * When true, the collection-level prefix and document-level prefix are combined
   * (compositional). When false (default), a document prefix already within the
   * collection prefix is used as-is for new uploads; otherwise it is nested beneath it.
   * Existing files retain their stored prefixes for reads, URLs, and cleanup.
   *
   * Example with a document prefix already contained by the collection prefix:
   * - collection prefix: `uploads/`
   * - document prefix: `uploads/documents/`
   * - resulting prefix with useCompositePrefixes=true: `uploads/uploads/documents/`
   * - resulting prefix with useCompositePrefixes=false: `uploads/documents/`
   *
   * @default false
   */
  useCompositePrefixes?: boolean
}

type R2StorageFactory = (r2StorageArgs: R2StorageOptions) => StorageAdapter

export const r2Storage: R2StorageFactory = (
  r2StorageOptions: R2StorageOptions,
): StorageAdapter => ({
  name: 'r2',
  collections: Object.keys(r2StorageOptions.collections),
  init: (incomingConfig: Config): Config => {
    const adapter = createR2Adapter({
      bucket: r2StorageOptions.bucket,
      clientUploads: r2StorageOptions.clientUploads,
      collections: r2StorageOptions.collections,
      useCompositePrefixes: r2StorageOptions.useCompositePrefixes,
    })

    const isPluginDisabled = r2StorageOptions.enabled === false

    if (isPluginDisabled) {
      // Still call cloudStoragePlugin with adapter: null so fields (like prefix) are
      // inserted into the schema, keeping it consistent across environments.
      const collectionsWithoutAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
        r2StorageOptions.collections,
      ).reduce(
        (acc, [slug, collOptions]) => ({
          ...acc,
          [slug]: { ...(collOptions === true ? {} : collOptions), adapter: null },
        }),
        {} as Record<string, CollectionOptions>,
      )

      return cloudStoragePlugin({
        collections: collectionsWithoutAdapter,
        enabled: false,
        useCompositePrefixes: r2StorageOptions.useCompositePrefixes,
      })(incomingConfig)
    }

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      r2StorageOptions.collections,
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
      useCompositePrefixes: r2StorageOptions.useCompositePrefixes,
    })(config)
  },
})
