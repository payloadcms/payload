import type { ContainerClient } from '@azure/storage-blob'

import { BlobServiceClient } from '@azure/storage-blob'

import type { Adapter, GeneratedAdapter } from '../../types.js'

import { getGenerateURL } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'

export interface Args {
  allowContainerCreate: boolean
  baseURL: string
  connectionString: string
  containerName: string
}

/**
 * @deprecated Use [`@payloadcms/azure`](https://www.npmjs.com/package/@payloadcms/azure) instead.
 *
 * This adapter has been superceded by `@payloadcms/azure` and will be removed in Payload 3.0.
 */
export const azureBlobStorageAdapter = ({
  allowContainerCreate,
  baseURL,
  connectionString,
  containerName,
}: Args): Adapter => {
  if (!BlobServiceClient) {
    throw new Error(
      'The package @azure/storage-blob is not installed, but is required for the plugin-cloud-storage Azure adapter. Please install it.',
    )
  }

  let storageClient: ContainerClient | null = null
  const getStorageClient = () => {
    if (storageClient) {
      return storageClient
    }
    let blobServiceClient = null
    try {
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    } catch (error) {
      if (/is not a constructor$/.test(error.message)) {
        throw new Error(
          'The package @azure/storage-blob is not installed, but is required for the plugin-cloud-storage Azure adapter. Please install it.',
        )
      }
      // Re-throw other unexpected errors.
      throw error
    }
    return (storageClient = blobServiceClient.getContainerClient(containerName))
  }

  const createContainerIfNotExists = () => {
    getStorageClient().createIfNotExists({ access: 'blob' })
  }

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
