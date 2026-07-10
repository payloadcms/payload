import type {
  ClientUploadsAccess,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, StorageAdapter, UploadCollectionSlug } from 'payload'
import type { createUploadthing } from 'uploadthing/server'
import type { UTApiOptions } from 'uploadthing/types'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'
import { UTApi } from 'uploadthing/server'

import { createUploadthingAdapter } from './adapter.js'
import { getClientUploadRoute } from './getClientUploadRoute.js'

export type FileRouterInputConfig = Parameters<ReturnType<typeof createUploadthing>>[0]

export type UploadthingStorageOptions = {
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
   * Do uploads directly on the client, to bypass limits on Vercel.
   */
  clientUploads?:
    | {
        access?: ClientUploadsAccess
        routerInputConfig?: FileRouterInputConfig
      }
    | boolean

  /**
   * Collection options to apply the adapter to.
   *
   * TODO V4: OMIT 'prefix' from the collection options - uploadthing does not support prefixes
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean

  /**
   * Uploadthing Options
   */
  options: {
    /**
     * @default 'public-read'
     */
    acl?: ACL
  } & UTApiOptions
}

type UploadthingStorageFactory = (
  uploadthingStorageOptions: UploadthingStorageOptions,
) => StorageAdapter

/** NOTE: not synced with uploadthing's internal types. Need to modify if more options added */
export type ACL = 'private' | 'public-read'

const deprecationWarning =
  'The `@payloadcms/storage-uploadthing` adapter is deprecated and will be removed in Payload v5. ' +
  'Migrate to another storage adapter such as `@payloadcms/storage-s3`. ' +
  'See https://payloadcms.com/docs/upload/storage-adapters for available adapters.'

const withDeprecationWarning = (config: Config): Config => ({
  ...config,
  onInit: async (payload) => {
    payload.logger.warn(deprecationWarning)

    if (config.onInit) {
      await config.onInit(payload)
    }
  },
})

/**
 * @deprecated The `@payloadcms/storage-uploadthing` adapter is deprecated and will be removed in
 * Payload v5. Migrate to another storage adapter such as `@payloadcms/storage-s3`. See
 * https://payloadcms.com/docs/upload/storage-adapters for available adapters.
 */
export const uploadthingStorage: UploadthingStorageFactory = (
  uploadthingStorageOptions: UploadthingStorageOptions,
): StorageAdapter => ({
  name: 'uploadthing',
  collections: Object.keys(uploadthingStorageOptions.collections),
  init: (incomingConfig: Config): Config => {
    const isPluginDisabled = uploadthingStorageOptions.enabled === false

    initClientUploads({
      clientHandler: '@payloadcms/storage-uploadthing/client#UploadthingClientUploadHandler',
      collections: uploadthingStorageOptions.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(uploadthingStorageOptions.clientUploads),
      serverHandler: getClientUploadRoute({
        access:
          typeof uploadthingStorageOptions.clientUploads === 'object'
            ? uploadthingStorageOptions.clientUploads.access
            : undefined,
        acl: uploadthingStorageOptions.options.acl || 'public-read',
        routerInputConfig:
          typeof uploadthingStorageOptions.clientUploads === 'object'
            ? uploadthingStorageOptions.clientUploads.routerInputConfig
            : undefined,
        token: uploadthingStorageOptions.options.token,
      }),
      serverHandlerPath: '/storage-uploadthing-client-upload-route',
    })

    if (isPluginDisabled) {
      return withDeprecationWarning(incomingConfig)
    }

    const { acl = 'public-read', ...utOptions } = uploadthingStorageOptions.options
    const utApi = new UTApi(utOptions)

    const adapter = createUploadthingAdapter({
      acl,
      clientUploads: uploadthingStorageOptions.clientUploads,
      utApi,
    })

    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      uploadthingStorageOptions.collections,
    ).reduce(
      (acc, [slug, collOptions]) => {
        const mergedOptions = {
          ...(collOptions === true ? {} : collOptions),
          adapter,
          prefix: '', // upload thing does not support prefixes
        }
        return {
          ...acc,
          [slug]: mergedOptions,
        }
      },
      {} as Record<string, CollectionOptions>,
    )

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

    return withDeprecationWarning(
      cloudStoragePlugin({
        alwaysInsertFields: uploadthingStorageOptions.alwaysInsertFields,
        collections: collectionsWithAdapter,
        useCompositePrefixes: false, // uploadthing does not support prefixes
      })(config),
    )
  },
})
