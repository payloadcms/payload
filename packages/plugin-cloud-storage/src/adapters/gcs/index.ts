import type { StorageOptions } from '@google-cloud/storage'

import { Storage } from '@google-cloud/storage'

import type { Adapter, GeneratedAdapter } from '../../types'

import { getGenerateURL } from './generateURL'
import { getHandleDelete } from './handleDelete'
import { getHandleUpload } from './handleUpload'
import { getHandler } from './staticHandler'
import { extendWebpackConfig } from './webpack'

export interface Args {
  acl?: 'Private' | 'Public'
  bucket: string
  options: StorageOptions
}

export const gcsAdapter =
  ({ acl, bucket, options }: Args): Adapter =>
  ({ collection, prefix }): GeneratedAdapter => {
    let storageClient: Storage | null = null

    const getStorageClient = (): Storage => {
      if (storageClient) return storageClient
      storageClient = new Storage(options)
      return storageClient
    }

    return {
      generateURL: getGenerateURL({ bucket, getStorageClient }),
      handleDelete: getHandleDelete({ bucket, getStorageClient }),
      handleUpload: getHandleUpload({
        acl,
        bucket,
        collection,
        getStorageClient,
        prefix,
      }),
      staticHandler: getHandler({ bucket, collection, getStorageClient }),
      webpack: extendWebpackConfig,
    }
  }
