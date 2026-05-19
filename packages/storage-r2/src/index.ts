import type {
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import type { R2Bucket, R2StorageClientUploadHandlerParams } from './types.js'

import { createR2Adapter } from './adapter.js'
import { getHandleMultiPartUpload } from './handleMultiPartUpload.js'

export interface R2StorageOptions {
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

  bucket: R2Bucket
  /**
   * Do uploads directly on the client, to bypass limits on Cloudflare/Vercel.
   */
  clientUploads?: ClientUploadsConfig
  /**
   * Collection options to apply the R2 adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>
  enabled?: boolean
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

type R2StoragePlugin = (r2StorageArgs: R2StorageOptions) => Plugin

export const r2Storage: R2StoragePlugin =
  (r2StorageOptions) =>
  (incomingConfig: Config): Config => {
    const adapter = createR2Adapter({
      bucket: r2StorageOptions.bucket,
      clientUploads: r2StorageOptions.clientUploads,
      useCompositePrefixes: r2StorageOptions.useCompositePrefixes,
    })

    const isPluginDisabled = r2StorageOptions.enabled === false

    initClientUploads<
      R2StorageClientUploadHandlerParams,
      R2StorageOptions['collections'][keyof R2StorageOptions['collections']]
    >({
      clientHandler: '@payloadcms/storage-r2/client#R2ClientUploadHandler',
      collections: r2StorageOptions.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(r2StorageOptions.clientUploads),
      serverHandler: getHandleMultiPartUpload({
        access:
          typeof r2StorageOptions.clientUploads === 'object'
            ? r2StorageOptions.clientUploads.access
            : undefined,
        bucket: r2StorageOptions.bucket,
        collections: r2StorageOptions.collections,
        useCompositePrefixes: r2StorageOptions.useCompositePrefixes,
      }),
      serverHandlerPath: '/storage-r2-multi-part-upload',
    })

    if (isPluginDisabled) {
      return incomingConfig
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
      alwaysInsertFields: r2StorageOptions.alwaysInsertFields,
      collections: collectionsWithAdapter,
      useCompositePrefixes: r2StorageOptions.useCompositePrefixes,
    })(config)
  }
