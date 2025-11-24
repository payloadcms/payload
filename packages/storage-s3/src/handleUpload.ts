import type * as AWS from '@aws-sdk/client-s3'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'

import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import path from 'path'
import { APIError, type CollectionConfig } from 'payload'

import type { S3StorageOptions } from './index.js'

interface Args {
  acl?: 'private' | 'public-read'
  bucket: string
  collection: CollectionConfig
  collections: S3StorageOptions['collections']
  getStorageClient: () => AWS.S3
  prefix?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export const getHandleUpload = ({
  acl,
  bucket,
  collection,
  collections,
  getStorageClient,
  prefix = '',
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(data.prefix || prefix, file.filename)

    const collectionS3Config = collections[collection.slug]
    if (!collectionS3Config) {
      throw new APIError(`Collection ${collection.slug} was not found in S3 options`)
    }

    const fileBufferOrStream = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : file.buffer

    if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
      await getStorageClient().putObject({
        ACL: acl,
        Body: fileBufferOrStream,
        Bucket: bucket,
        CacheControl:
          typeof collectionS3Config === 'object' ? collectionS3Config.cacheControl : undefined,
        ContentType: file.mimeType,
        Key: fileKey,
      })

      return data
    }

    const parallelUploadS3 = new Upload({
      client: getStorageClient(),
      params: {
        ACL: acl,
        Body: fileBufferOrStream,
        Bucket: bucket,
        CacheControl:
          typeof collectionS3Config === 'object' ? collectionS3Config.cacheControl : undefined,
        ContentType: file.mimeType,
        Key: fileKey,
      },
      partSize: multipartThreshold,
      queueSize: 4,
    })

    await parallelUploadS3.done()

    return data
  }
}
