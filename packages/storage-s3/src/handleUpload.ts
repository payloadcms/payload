import type * as AWS from '@aws-sdk/client-s3'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { Upload } from '@aws-sdk/lib-storage'
import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import fs from 'fs'
import path from 'path'

interface Args {
  acl?: 'private' | 'public-read'
  basePrefix?: string
  bucket: string
  collection: CollectionConfig
  getStorageClient: () => AWS.S3
  prefix?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export const getHandleUpload = ({
  acl,
  basePrefix,
  bucket,
  getStorageClient,
  prefix = '',
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(
      joinPrefixes([
        { prefix: basePrefix, sanitize: false },
        data.prefix || { prefix, sanitize: false },
      ]),
      file.filename,
    )

    const fileBufferOrStream = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : file.buffer

    if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
      await getStorageClient().putObject({
        ACL: acl,
        Body: fileBufferOrStream,
        Bucket: bucket,
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
