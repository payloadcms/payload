import * as AWS from '@aws-sdk/client-s3'

import type { Adapter, GeneratedAdapter } from '../../types.js'

import { getGenerateURL } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'

export interface Args {
  acl?: 'private' | 'public-read'
  /**
   * Bucket name to upload files to.
   *
   * Must follow [AWS S3 bucket naming conventions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html).
   */
  bucket: string
  /**
   * AWS S3 client configuration. Highly dependent on your AWS setup.
   *
   * [AWS.S3ClientConfig Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html)
   */
  config: AWS.S3ClientConfig
}

/**
 * @deprecated Use [`@payloadcms/storage-s3`](https://www.npmjs.com/package/@payloadcms/storage-s3) instead.
 *
 * This adapter has been superceded by `@payloadcms/storage-s3` and will be removed in Payload 3.0.
 */
export const s3Adapter =
  ({ acl, bucket, config = {} }: Args): Adapter =>
  ({ collection, prefix }): GeneratedAdapter => {
    if (!AWS) {
      throw new Error(
        'The packages @aws-sdk/client-s3, @aws-sdk/lib-storage and aws-crt are not installed, but are required for the plugin-cloud-storage S3 adapter. Please install them.',
      )
    }
    let storageClient: AWS.S3 | null = null
    const getStorageClient: () => AWS.S3 = () => {
      if (storageClient) {
        return storageClient
      }
      try {
        storageClient = new AWS.S3(config)
      } catch (error) {
        if (/is not a constructor$/.test(error.message)) {
          throw new Error(
            'The packages @aws-sdk/client-s3, @aws-sdk/lib-storage and aws-crt are not installed, but are required for the plugin-cloud-storage S3 adapter. Please install them.',
          )
        }
        // Re-throw other unexpected errors.
        throw error
      }
      return storageClient
    }

    return {
      name: 's3',
      generateURL: getGenerateURL({ bucket, config }),
      handleDelete: getHandleDelete({ bucket, getStorageClient }),
      handleUpload: getHandleUpload({
        acl,
        bucket,
        collection,
        getStorageClient,
        prefix,
      }),
      staticHandler: getHandler({ bucket, collection, getStorageClient }),
    }
  }
