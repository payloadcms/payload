import * as AWS from '@aws-sdk/client-s3'
import type { Adapter, GeneratedAdapter } from '../../types'
import { getGenerateURL } from './generateURL'
import { getHandler } from './staticHandler'
import { getHandleDelete } from './handleDelete'
import { getHandleUpload } from './handleUpload'
import { extendWebpackConfig } from './webpack'

export interface Args {
  /**
   * AWS S3 client configuration. Highly dependent on your AWS setup.
   *
   * [AWS.S3ClientConfig Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html)
   */
  config: AWS.S3ClientConfig
  /**
   * Bucket name to upload files to.
   *
   * Must follow [AWS S3 bucket naming conventions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html).
   */
  bucket: string
  acl?: 'private' | 'public-read'
}

export const s3Adapter =
  ({ config = {}, bucket, acl }: Args): Adapter =>
  ({ collection, prefix }): GeneratedAdapter => {
    let storageClient: AWS.S3 | null = null
    const getStorageClient: () => AWS.S3 = () => {
      if (storageClient) return storageClient
      storageClient = new AWS.S3(config)
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
      generateURL: getGenerateURL({ bucket, config }),
      staticHandler: getHandler({ bucket, getStorageClient, collection }),
      webpack: extendWebpackConfig,
    }
  }
