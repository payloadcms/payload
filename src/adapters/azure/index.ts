import type { Adapter, GeneratedAdapter } from '../../types'
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
    return {
      handleUpload: getHandleUpload({
        collection,
        connectionString,
        containerName,
        baseURL,
        allowContainerCreate,
      }),
      handleDelete: getHandleDelete({ collection, connectionString, containerName, baseURL }),
      generateURL: getGenerateURL({ containerName, baseURL }),
      webpack: extendWebpackConfig,
    }
  }
