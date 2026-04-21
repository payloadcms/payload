import type {
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import type { VercelBlobClientUploadHandlerExtra } from './client/VercelBlobClientUploadHandler.js'

import { createVercelBlobAdapter } from './adapter.js'
import { getClientUploadRoute } from './getClientUploadRoute.js'

export type VercelBlobStorageOptions = {
  /**
   * Access control level. Currently, only 'public' is supported.
   * Vercel plans on adding support for private blobs in the future.
   *
   * @default 'public'
   */
  access?: 'public'

  /**
   * Add a random suffix to the uploaded file name in Vercel Blob storage
   *
   * @default false
   */
  addRandomSuffix?: boolean

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
   * Cache-Control max-age in seconds
   *
   * @default 365 * 24 * 60 * 60 // (1 Year)
   */
  cacheControlMaxAge?: number

  /**
   * Do uploads directly on the client, to bypass limits on Vercel.
   */
  clientUploads?: ClientUploadsConfig

  /**
   * Collections to apply the Vercel Blob adapter to
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean
  /**
   * Vercel Blob storage read/write token
   *
   * Usually process.env.BLOB_READ_WRITE_TOKEN set by Vercel
   *
   * If unset, the plugin will be disabled and will fallback to local storage
   */
  token: string | undefined

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

const defaultUploadOptions: Partial<VercelBlobStorageOptions> = {
  access: 'public',
  addRandomSuffix: false,
  cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
  enabled: true,
}

type VercelBlobStoragePlugin = (vercelBlobStorageOpts: VercelBlobStorageOptions) => Plugin

export const vercelBlobStorage: VercelBlobStoragePlugin =
  (options: VercelBlobStorageOptions) =>
  (incomingConfig: Config): Config => {
    // Parse storeId from token
    const storeId = options.token
      ?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]
      ?.toLowerCase()

    const isPluginDisabled = options.enabled === false || !options.token

    // Don't throw if the plugin is disabled
    if (!storeId && !isPluginDisabled) {
      throw new Error(
        'Invalid token format for Vercel Blob adapter. Should be vercel_blob_rw_<store_id>_<random_string>.',
      )
    }

    const optionsWithDefaults = {
      ...defaultUploadOptions,
      ...options,
    }

    // support overriding the base URL for emulator https://github.com/payloadcms/vercel-blob-emulator
    const baseUrl =
      process.env.STORAGE_VERCEL_BLOB_BASE_URL ||
      `https://${storeId}.${optionsWithDefaults.access}.blob.vercel-storage.com`

    initClientUploads<
      VercelBlobClientUploadHandlerExtra,
      VercelBlobStorageOptions['collections'][string]
    >({
      clientHandler: '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler',
      collections: options.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(options.clientUploads),
      extraClientHandlerProps: () => ({
        addRandomSuffix: !!optionsWithDefaults.addRandomSuffix,
        useCompositePrefixes: !!options.useCompositePrefixes,
      }),
      serverHandler: getClientUploadRoute({
        access:
          typeof options.clientUploads === 'object' ? options.clientUploads.access : undefined,
        addRandomSuffix: optionsWithDefaults.addRandomSuffix,
        cacheControlMaxAge: options.cacheControlMaxAge,
        token: options.token ?? '',
      }),
      serverHandlerPath: '/vercel-blob-client-upload-route',
    })

    // If the plugin is disabled or no token is provided, do not enable the plugin
    if (isPluginDisabled) {
      if (options.alwaysInsertFields) {
        const collectionsWithoutAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
          options.collections,
        ).reduce(
          (acc, [slug, collOptions]) => ({
            ...acc,
            [slug]: { ...(collOptions === true ? {} : collOptions), adapter: null },
          }),
          {} as Record<string, CollectionOptions>,
        )
        return cloudStoragePlugin({
          alwaysInsertFields: true,
          collections: collectionsWithoutAdapter,
          enabled: false,
          useCompositePrefixes: options.useCompositePrefixes,
        })(incomingConfig)
      }
      return incomingConfig
    }

    const adapter = createVercelBlobAdapter({
      access: optionsWithDefaults.access ?? 'public',
      addRandomSuffix: optionsWithDefaults.addRandomSuffix,
      baseUrl,
      cacheControlMaxAge: optionsWithDefaults.cacheControlMaxAge ?? 60 * 60 * 24 * 365,
      clientUploads: optionsWithDefaults.clientUploads,
      token: options.token!,
      useCompositePrefixes: options.useCompositePrefixes,
    })

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      options.collections,
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
      alwaysInsertFields: options.alwaysInsertFields,
      collections: collectionsWithAdapter,
      useCompositePrefixes: options.useCompositePrefixes,
    })(config)
  }
