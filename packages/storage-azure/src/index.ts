import type {
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import { createAzureAdapter } from './adapter.js'
import { getGenerateSignedURLHandler } from './generateSignedURL.js'
import { getStorageClient as getStorageClientFunc } from './utils/getStorageClient.js'

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
   */
  clientUploads?: ClientUploadsConfig

  /**
   * Collection options to apply the Azure Blob adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * Azure Blob storage connection string
   */
  connectionString: string

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

    initClientUploads({
      clientHandler: '@payloadcms/storage-azure/client#AzureClientUploadHandler',
      collections: azureStorageOptions.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(azureStorageOptions.clientUploads),
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

    const createContainerIfNotExists = () => {
      void getStorageClientFunc({
        connectionString: azureStorageOptions.connectionString,
        containerName: azureStorageOptions.containerName,
      }).createIfNotExists({
        access: 'blob',
      })
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
