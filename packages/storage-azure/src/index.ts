import type {
  ClientUploadsAccess,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import { createAzureAdapter } from './adapter.js'
import { getGenerateSignedURLHandler } from './generateSignedURL.js'
import { isAzureClientUploadAllowed } from './isClientUploadAllowed.js'
import { getStorageClient as getStorageClientFunc } from './utils/getStorageClient.js'

export type AzureClientUploadsConfig =
  | {
      access?: ClientUploadsAccess
      /**
       * Upload large files in blocks via the Azure Blob SDK, lifting the ~5GB
       * single-request limit. Requires broader CORS on the storage account
       * (the `OPTIONS`/`PUT` methods and `x-ms-*` headers).
       *
       * @default false
       */
      chunkLargeFiles?: boolean
    }
  | boolean

export type AzureStorageOptions = {
  /**
   * Whether or not to allow the container to be created if it does not exist
   *
   * @default false
   */
  allowContainerCreate: boolean

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
   * Base URL for the Azure Blob storage account
   */
  baseURL: string

  /**
   * Optional cache key to identify the Azure Blob storage client instance.
   * If not provided, a default key will be used.
   *
   * @default `azure:containerName`
   */
  clientCacheKey?: string

  /**
   * Do uploads directly on the client to bypass limits on Vercel. You must allow CORS PUT method to your website.
   *
   * Set `chunkLargeFiles: true` to upload through the Azure Blob SDK, which splits
   * large files into blocks and lifts the ~5GB single-request limit. The SDK sends
   * additional `x-ms-*` headers, so your storage account's CORS rules must allow the
   * `OPTIONS` and `PUT` methods and those headers (allowed headers `*`, or at minimum
   * `x-ms-*,content-type,content-length`). Left off, uploads use a single request
   * (the default) and are capped at ~5GB.
   */
  clientUploads?: AzureClientUploadsConfig

  /**
   * Collection options to apply the Azure Blob adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * Azure Blob storage connection string
   */
  connectionString: string

  /**
   * Public access level applied to a container that the plugin creates via
   * `allowContainerCreate`. Has no effect on containers that already exist.
   *
   * - `'private'` (default): no anonymous access. Blobs are reachable only
   *   through Payload's access-controlled file route.
   * - `'blob'`: unauthenticated clients can read any blob directly from Azure.
   * - `'container'`: unauthenticated clients can read and list blobs directly.
   *
   * Only choose `'blob'` or `'container'` if you deliberately want files served
   * publicly from Azure, bypassing Payload read access control.
   *
   * @default 'private'
   */
  containerAccess?: 'blob' | 'container' | 'private'

  /**
   * Azure Blob storage container name
   */
  containerName: string

  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
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

type AzureStoragePlugin = (azureStorageArgs: AzureStorageOptions) => Plugin

export const azureStorage: AzureStoragePlugin =
  (azureStorageOptions: AzureStorageOptions) =>
  (incomingConfig: Config): Config => {
    const getStorageClient = () =>
      getStorageClientFunc({
        connectionString: azureStorageOptions.connectionString,
        containerName: azureStorageOptions.containerName,
      })

    const isPluginDisabled = azureStorageOptions.enabled === false

    const clientUploadCollections = Object.fromEntries(
      Object.entries(azureStorageOptions.collections).filter(([slug]) =>
        isAzureClientUploadAllowed(
          incomingConfig.collections?.find((collection) => collection.slug === slug),
        ),
      ),
    )

    initClientUploads({
      clientHandler: '@payloadcms/storage-azure/client#AzureClientUploadHandler',
      collections: clientUploadCollections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(azureStorageOptions.clientUploads),
      extraClientHandlerProps: () => ({
        chunkLargeFiles:
          typeof azureStorageOptions.clientUploads === 'object'
            ? Boolean(azureStorageOptions.clientUploads.chunkLargeFiles)
            : false,
      }),
      serverHandler: getGenerateSignedURLHandler({
        access:
          typeof azureStorageOptions.clientUploads === 'object'
            ? azureStorageOptions.clientUploads.access
            : undefined,
        collections: azureStorageOptions.collections,
        containerName: azureStorageOptions.containerName,
        getStorageClient,
        useCompositePrefixes: azureStorageOptions.useCompositePrefixes,
      }),
      serverHandlerPath: '/storage-azure-generate-signed-url',
    })

    if (isPluginDisabled) {
      return incomingConfig
    }

    const createContainerIfNotExists = async (): Promise<void> => {
      const containerClient = getStorageClientFunc({
        connectionString: azureStorageOptions.connectionString,
        containerName: azureStorageOptions.containerName,
      })

      // Private by default; public access is opt-in via `containerAccess`.
      const containerAccess = azureStorageOptions.containerAccess ?? 'private'

      if (containerAccess === 'private') {
        await containerClient.createIfNotExists()
      } else {
        await containerClient.createIfNotExists({ access: containerAccess })
      }
    }

    const adapter = createAzureAdapter({
      allowContainerCreate: azureStorageOptions.allowContainerCreate,
      baseURL: azureStorageOptions.baseURL,
      clientUploads: azureStorageOptions.clientUploads,
      containerName: azureStorageOptions.containerName,
      createContainerIfNotExists,
      getStorageClient,
      useCompositePrefixes: azureStorageOptions.useCompositePrefixes,
    })

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      azureStorageOptions.collections,
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
      alwaysInsertFields: azureStorageOptions.alwaysInsertFields,
      collections: collectionsWithAdapter,
      useCompositePrefixes: azureStorageOptions.useCompositePrefixes,
    })(config)
  }

export { getStorageClientFunc as getStorageClient }
