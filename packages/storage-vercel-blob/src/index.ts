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
import { resolveBlobConfig } from './resolveBlobConfig.js'

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
   * Vercel Blob store ID (the `store_<id>` identifier, with or without the
   * `store_` prefix).
   *
   * Only needed for OIDC authentication (see `token`). When the adapter runs on
   * Vercel with a connected Blob store, Vercel sets `BLOB_STORE_ID` in the
   * environment and this is picked up automatically, so you usually don't need
   * to set it. Provide it explicitly when `BLOB_STORE_ID` is not available
   * (e.g. a team-level store, or code running outside Vercel with a manual OIDC
   * token).
   *
   * Ignored when a read/write `token` is provided, because the store ID is
   * derived from the token in that case.
   */
  storeId?: string

  /**
   * Vercel Blob storage read/write token.
   *
   * Usually process.env.BLOB_READ_WRITE_TOKEN set by Vercel.
   *
   * Leave this unset to use OIDC authentication instead (now the default for
   * newly connected Vercel Blob stores). In OIDC mode, Vercel issues
   * short-lived tokens that `@vercel/blob` resolves automatically from the
   * environment (`VERCEL_OIDC_TOKEN`), and the store is identified by
   * `storeId` / the `BLOB_STORE_ID` environment variable instead of by the
   * token. The plugin is only disabled (falling back to local storage) when
   * neither a token nor a resolvable store ID is available.
   */
  token?: string | undefined

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
    const optionsWithDefaults = {
      ...defaultUploadOptions,
      ...options,
    }

    // Whether a read/write token was supplied. When it is absent the adapter
    // runs in OIDC mode and lets @vercel/blob resolve credentials from the
    // environment (VERCEL_OIDC_TOKEN), so `undefined` is threaded through.
    const token = options.token

    // Resolve the store ID (needed to build public blob URLs), the base URL,
    // and whether the plugin should be disabled. See resolveBlobConfig for the
    // precedence rules and OIDC behavior.
    const { baseUrl, isPluginDisabled, storeId } = resolveBlobConfig({
      access: optionsWithDefaults.access ?? 'public',
      enabled: options.enabled,
      envBaseUrl: process.env.STORAGE_VERCEL_BLOB_BASE_URL,
      envStoreId: process.env.BLOB_STORE_ID,
      storeId: options.storeId,
      token: options.token,
    })

    initClientUploads<
      VercelBlobClientUploadHandlerExtra,
      VercelBlobStorageOptions['collections'][string]
    >({
      clientHandler: '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler',
      collections: options.collections,
      config: incomingConfig,
      // Client uploads mint short-lived client tokens server-side, which
      // requires a read/write token. OIDC is not supported for that exchange,
      // so client uploads are only enabled when a token is present.
      enabled: !isPluginDisabled && Boolean(options.clientUploads) && Boolean(token),
      extraClientHandlerProps: () => ({
        addRandomSuffix: !!optionsWithDefaults.addRandomSuffix,
        useCompositePrefixes: !!options.useCompositePrefixes,
      }),
      serverHandler: getClientUploadRoute({
        access:
          typeof options.clientUploads === 'object' ? options.clientUploads.access : undefined,
        addRandomSuffix: optionsWithDefaults.addRandomSuffix,
        cacheControlMaxAge: options.cacheControlMaxAge,
        collections: options.collections,
        storeId,
        token,
        useCompositePrefixes: optionsWithDefaults.useCompositePrefixes,
      }),
      serverHandlerPath: '/vercel-blob-client-upload-route',
    })

    // If the plugin is disabled (explicitly, or because neither a token nor a
    // resolvable store ID is available), do not enable the plugin
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
      storeId,
      token,
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
