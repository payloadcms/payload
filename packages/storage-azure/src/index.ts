import type { BatchSubRequest } from '@azure/storage-blob'
import type {
  Adapter,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

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
   * Collection options to apply the Azure Blob adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * Azure Blob storage connection string
   */
  connectionString?: string
  /**
   * Azure Blob storage container name
   */
  containerName: string

  /**
   * Instead of a connection string you can chose to use any object that implements the TokenCredential interface if you are securing your storage with RBAC, such as AnonymousCredential, StorageSharedKeyCredential or any credential from the `@azure/identity` package to authenticate requests to the service.
   */
  credential?: BatchSubRequest['credential']

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
    if (azureStorageOptions.enabled === false) {
      return incomingConfig
    }

    const adapter = azureStorageInternal(azureStorageOptions)

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

function azureStorageInternal({
  allowContainerCreate,
  baseURL,
  connectionString,
  containerName,
  credential,
}: AzureStorageOptions): Adapter {
  const createContainerIfNotExists = () => {
    void getStorageClientFunc({
      baseURL,
      connectionString,
      containerName,
      credential,
    }).createIfNotExists({
      access: 'blob',
    })
  }

  const getStorageClient = () =>
    getStorageClientFunc({ baseURL, connectionString, containerName, credential })

  return ({ collection, prefix }): GeneratedAdapter => {
    return {
      name: 'azure',
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
