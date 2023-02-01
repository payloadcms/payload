import fs from 'fs'
import path from 'path'
import type * as AWS from '@aws-sdk/client-s3'
import type { CollectionConfig } from 'payload/types'
import type stream from 'stream'
import type { HandleUpload } from '../../types'

interface Args {
  collection: CollectionConfig
  bucket: string
  acl?: 'private' | 'public-read'
  prefix?: string
  getStorageClient: () => AWS.S3
}

export const getHandleUpload = ({
  getStorageClient,
  bucket,
  acl,
  prefix = '',
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(prefix, file.filename)

    let fileBufferOrStream: Buffer | stream.Readable
    if (file.tempFilePath) {
      fileBufferOrStream = fs.createReadStream(file.tempFilePath)
    } else {
      fileBufferOrStream = file.buffer
    }

    await getStorageClient().putObject({
      Bucket: bucket,
      Key: fileKey,
      Body: fileBufferOrStream,
      ACL: acl,
      ContentType: file.mimeType,
    })

    return data
  }
}
