import type { ContainerClient } from '@azure/storage-blob'
import type {
  Adapter,
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import { getGenerateSignedURLHandler } from './generateSignedURL.js'
import { getGenerateURL } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'
import { getStorageClient as getStorageClientFunc } from './utils/getStorageClient.js'

export type AzureStorageOptions = {
  /**
   * Whether or not to allow the container to be created if it does not exist
   *
   * @default false
   */
  allowContainerCreate: boolean

  /**
   * Base URL for the Azure Blob storage account
   */
  baseURL: string

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
      }),
      serverHandlerPath: '/storage-azure-generate-signed-url',
    })

    if (isPluginDisabled) {
      return incomingConfig
    }

    const adapter = azureStorageInternal(getStorageClient, azureStorageOptions)

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
      collections: collectionsWithAdapter,
    })(config)
  }

function azureStorageInternal(
  getStorageClient: () => ContainerClient,
  {
    allowContainerCreate,
    baseURL,
    clientUploads,
    connectionString,
    containerName,
  }: AzureStorageOptions,
): Adapter {
  const createContainerIfNotExists = () => {
    void getStorageClientFunc({ connectionString, containerName }).createIfNotExists({
      access: 'blob',
    })
  }

  return ({ collection, prefix }): GeneratedAdapter => {
    return {
      name: 'azure',
      clientUploads,
      generateURL: getGenerateURL({ baseURL, containerName }),
      handleDelete: getHandleDelete({ collection, getStorageClient }),
      handleUpload: getHandleUpload({
        collection,
        getStorageClient,
        prefix,
      }),
      staticHandler: getHandler({ collection, getStorageClient }),
      ...(allowContainerCreate && { onInit: createContainerIfNotExists }),
    }
  }
}

export { getStorageClientFunc as getStorageClient }
