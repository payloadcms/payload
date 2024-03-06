import type { ContainerClient } from '@azure/storage-blob'

import { BlobServiceClient } from '@azure/storage-blob'

import type { Adapter, GeneratedAdapter } from '../../types.d.ts'

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

export const azureBlobStorageAdapter = ({
  allowContainerCreate,
  baseURL,
  connectionString,
  containerName,
}: Args): Adapter => {
  let storageClient: ContainerClient | null = null
  const getStorageClient = () => {
    if (storageClient) return storageClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    return (storageClient = blobServiceClient.getContainerClient(containerName))
  }

  const createContainerIfNotExists = () => {
    getStorageClient().createIfNotExists({ access: 'blob' })
  }

  return ({ collection, prefix }): GeneratedAdapter => {
    return {
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
