import { Storage, StorageOptions } from '@google-cloud/storage'
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
    const gcs = new Storage(options)

    return {
      handleUpload: getHandleUpload({
        collection,
        gcs,
        bucket,
        acl,
        prefix,
      }),
      handleDelete: getHandleDelete({ gcs, bucket }),
      generateURL: getGenerateURL({ gcs, bucket }),
      staticHandler: getHandler({ gcs, bucket, collection }),
      webpack: extendWebpackConfig,
    }
  }
