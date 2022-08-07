import { BlobServiceClient } from '@azure/storage-blob'
import type { Adapter, GeneratedAdapter } from '../../types'
import { getHandler } from './staticHandler'
import { getGenerateURL } from './generateURL'
import { getHandleDelete } from './handleDelete'
import { getHandleUpload } from './handleUpload'
import { extendWebpackConfig } from './webpack'

export interface Args {
  connectionString: string
  containerName: string
  baseURL: string
  allowContainerCreate: boolean
}

export const azureBlobStorageAdapter =
  ({ connectionString, containerName, baseURL, allowContainerCreate }: Args): Adapter =>
  ({ collection }): GeneratedAdapter => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)

    return {
      handleUpload: getHandleUpload({
        collection,
        containerClient,
        allowContainerCreate,
      }),
      handleDelete: getHandleDelete({ collection, containerClient }),
      generateURL: getGenerateURL({ containerName, baseURL }),
      staticHandler: getHandler({ containerClient }),
      webpack: extendWebpackConfig,
    }
  }
