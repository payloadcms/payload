import type * as AWS from '@aws-sdk/client-s3'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'

import { Upload } from '@aws-sdk/lib-storage'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import fs from 'fs'

interface Args {
  acl?: 'private' | 'public-read'
  bucket: string
  collectionPrefix?: string
  getStorageClient: () => AWS.S3
  useCompositePrefixes?: boolean
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export const getHandleUpload = ({
  acl,
  bucket,
  collectionPrefix = '',
  getStorageClient,
  useCompositePrefixes = false,
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: data.prefix,
      filename: file.filename,
      useCompositePrefixes,
    })

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
