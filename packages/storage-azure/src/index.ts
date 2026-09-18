import type { TokenCredential } from '@azure/core-auth'
import type {
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, StorageAdapter, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

import { createAzureAdapter } from './adapter.js'
import {
  getBlobServiceClient as getBlobServiceClientFunc,
  getStorageClient as getStorageClientFunc,
} from './utils/getStorageClient.js'

/**
 * Authentication for the Azure Blob storage account. Exactly one of the
 * following must be provided:
 *
 * - `connectionString` — account-key or SAS-based connection string
 * - `credential` — an Entra ID `TokenCredential` (e.g. `DefaultAzureCredential`
 *   from `@azure/identity`) for managed identity / workload identity auth
 */
type AzureStorageAuth =
  | {
      /**
       * Azure Blob storage connection string
       */
      connectionString: string
      credential?: never
    }
  | {
      connectionString?: never
      /**
       * Entra ID credential used to authenticate against the storage account,
       * e.g. `DefaultAzureCredential` or `ManagedIdentityCredential` from
       * `@azure/identity`.
       *
       * When set, `baseURL` must be the storage account's blob endpoint
       * (`https://<account>.blob.core.windows.net`), not a CDN URL.
       *
       * The identity requires the `Storage Blob Data Contributor` role on the
       * account or container. Client uploads (`clientUploads`) additionally rely
       * on user delegation SAS, whose `generateUserDelegationKey` action is
       * included in that role.
       */
      credential: TokenCredential
    }

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
   * Do uploads directly on the client to bypass limits on Vercel.
   *
   * Client uploads use the Azure Blob SDK, which splits large files into blocks
   * (avoiding the ~5GB limit of a single upload request). The SDK sends `x-ms-*`
   * headers, so the browser issues a CORS preflight: your storage account's CORS
   * rules must allow the `OPTIONS` and `PUT` methods and the required headers
   * (allowed headers `*`, or at minimum `x-ms-*,content-type,content-length`).
   */
  clientUploads?: ClientUploadsConfig

  /**
   * Collection options to apply the Azure Blob adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

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
} & AzureStorageAuth

type AzureStorageFactory = (azureStorageArgs: AzureStorageOptions) => StorageAdapter

export const azureStorage: AzureStorageFactory = (
  azureStorageOptions: AzureStorageOptions,
): StorageAdapter => ({
  name: 'azure',
  collections: Object.keys(azureStorageOptions.collections),
  init: (incomingConfig: Config): Config => {
    const storageClientArgs = {
      baseURL: azureStorageOptions.baseURL,
      clientCacheKey: azureStorageOptions.clientCacheKey,
      connectionString: azureStorageOptions.connectionString,
      containerName: azureStorageOptions.containerName,
      credential: azureStorageOptions.credential,
    }

    const getStorageClient = () => getStorageClientFunc(storageClientArgs)
    const getBlobServiceClient = () => getBlobServiceClientFunc(storageClientArgs)

    const isPluginDisabled = azureStorageOptions.enabled === false

    if (isPluginDisabled) {
      return incomingConfig
    }

    const createContainerIfNotExists = () => {
      void getStorageClient().createIfNotExists({
        access: 'blob',
      })
    }

    const adapter = createAzureAdapter({
      allowContainerCreate: azureStorageOptions.allowContainerCreate,
      baseURL: azureStorageOptions.baseURL,
      clientUploads: azureStorageOptions.clientUploads,
      containerName: azureStorageOptions.containerName,
      createContainerIfNotExists,
      getBlobServiceClient,
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
  },
})

export { getStorageClientFunc as getStorageClient }
