import type { TokenCredential } from '@azure/core-http'
import type {
  AnonymousCredential,
  ContainerClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'

import { BlobServiceClient } from '@azure/storage-blob'

import type { Adapter, GeneratedAdapter } from '../../types'

import { getGenerateURL } from './generateURL'
import { getHandleDelete } from './handleDelete'
import { getHandleUpload } from './handleUpload'
import { getHandler } from './staticHandler'
import { extendWebpackConfig } from './webpack'

export interface Args {
  allowContainerCreate: boolean
  baseURL: string
  connectionString: string
  containerName: string
  credential?: AnonymousCredential | StorageSharedKeyCredential | TokenCredential
}

export const azureBlobStorageAdapter = ({
  allowContainerCreate,
  baseURL,
  connectionString,
  containerName,
  credential,
}: Args): Adapter => {
  let storageClient: ContainerClient | null = null
  const getStorageClient = () => {
    if (storageClient) return storageClient
    const blobServiceClient = credential
      ? new BlobServiceClient(connectionString, credential)
      : BlobServiceClient.fromConnectionString(connectionString)
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
      webpack: extendWebpackConfig,
      ...(allowContainerCreate && { onInit: createContainerIfNotExists }),
    }
  }
}
