import type {
  Adapter,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@ruya.sa/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from '@ruya.sa/payload'

import { cloudStoragePlugin } from '@ruya.sa/plugin-cloud-storage'

import type { R2Bucket } from './types.js'

import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'

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
   * Collection options to apply the R2 adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>
  enabled?: boolean
}

type R2StoragePlugin = (r2StorageArgs: R2StorageOptions) => Plugin

export const r2Storage: R2StoragePlugin =
  (r2StorageOptions) =>
  (incomingConfig: Config): Config => {
    const adapter = r2StorageInternal(r2StorageOptions)

    const isPluginDisabled = r2StorageOptions.enabled === false

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
    })(config)
  }

function r2StorageInternal({ bucket }: R2StorageOptions): Adapter {
  return ({ collection, prefix }): GeneratedAdapter => {
    return {
      name: 'r2',
      handleDelete: getHandleDelete({ bucket }),
      handleUpload: getHandleUpload({
        bucket,
        collection,
        prefix,
      }),
      staticHandler: getHandler({ bucket, collection, prefix }),
    }
  }
}
