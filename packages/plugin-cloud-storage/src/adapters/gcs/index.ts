import type { StorageOptions } from '@google-cloud/storage'
import { Storage } from '@google-cloud/storage'
import type { Adapter, GeneratedAdapter } from '../../types'
import { getGenerateURL } from './generateURL'
import { getHandler } from './staticHandler'
import { getHandleDelete } from './handleDelete'
import { getHandleUpload } from './handleUpload'
import { extendWebpackConfig } from './webpack'

export interface Args {
  options: StorageOptions
  bucket: string
  acl?: 'Private' | 'Public'
}

export const gcsAdapter =
  ({ options, bucket, acl }: Args): Adapter =>
  ({ collection, prefix }): GeneratedAdapter => {
    let storageClient: Storage | null = null

    const getStorageClient = (): Storage => {
      if (storageClient) return storageClient
      storageClient = new Storage(options)
      return storageClient
    }

    return {
      handleUpload: getHandleUpload({
        collection,
        getStorageClient,
        bucket,
        acl,
        prefix,
      }),
      handleDelete: getHandleDelete({ getStorageClient, bucket }),
      generateURL: getGenerateURL({ getStorageClient, bucket }),
      staticHandler: getHandler({ getStorageClient, bucket, collection }),
      webpack: extendWebpackConfig,
    }
  }
