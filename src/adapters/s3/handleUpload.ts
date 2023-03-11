import fs from 'fs'
import path from 'path'
import type * as AWS from '@aws-sdk/client-s3'
import type { CollectionConfig } from 'payload/types'
import type stream from 'stream'

import { Upload } from '@aws-sdk/lib-storage'
import type { HandleUpload } from '../../types'

interface Args {
  collection: CollectionConfig
  bucket: string
  acl?: 'private' | 'public-read'
  prefix?: string
  getStorageClient: () => AWS.S3
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export const getHandleUpload = ({
  getStorageClient,
  bucket,
  acl,
  prefix = '',
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(prefix, file.filename)

    const fileBufferOrStream: Buffer | stream.Readable = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : file.buffer

    if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
      await getStorageClient().putObject({
        Bucket: bucket,
        Key: fileKey,
        Body: fileBufferOrStream,
        ACL: acl,
        ContentType: file.mimeType,
      })

      return data
    }

    const parallelUploadS3 = new Upload({
      client: getStorageClient(),
      params: {
        Bucket: bucket,
        Key: fileKey,
        Body: fileBufferOrStream,
        ACL: acl,
        ContentType: file.mimeType,
      },
      queueSize: 4,
      partSize: multipartThreshold,
    })

    await parallelUploadS3.done()

    return data
  }
}
