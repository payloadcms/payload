import * as AWS from '@aws-sdk/client-s3'
import type { Adapter, GeneratedAdapter } from '../../types'
import { getGenerateURL } from './generateURL'
import { getHandler } from './staticHandler'
import { getHandleDelete } from './handleDelete'
import { getHandleUpload } from './handleUpload'
import { extendWebpackConfig } from './webpack'

export interface Args {
  config: AWS.S3ClientConfig
  bucket: string
  acl?: 'private' | 'public-read'
}

export const s3Adapter =
  ({ config, bucket, acl }: Args): Adapter =>
  ({ collection }): GeneratedAdapter => {
    const s3 = new AWS.S3(config)

    return {
      handleUpload: getHandleUpload({
        collection,
        s3,
        bucket,
        acl,
      }),
      handleDelete: getHandleDelete({ s3, bucket }),
      generateURL: getGenerateURL({ bucket, config }),
      staticHandler: getHandler({ bucket, s3 }),
      webpack: extendWebpackConfig,
    }
  }
