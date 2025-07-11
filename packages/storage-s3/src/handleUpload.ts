import type * as AWS from '@aws-sdk/client-s3'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import path from 'path'

import type { EncryptionConfig } from './encryptionParams.js'

import { getEncryptionParams } from './encryptionParams.js'

interface Args {
  acl?: 'private' | 'public-read'
  bucket: string
  collection: CollectionConfig
  encryption?: EncryptionConfig
  getStorageClient: () => AWS.S3
  prefix?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export const getHandleUpload = ({
  acl,
  bucket,
  encryption,
  getStorageClient,
  prefix = '',
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(data.prefix || prefix, file.filename)

    const fileBufferOrStream = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : file.buffer

    const encryptionParams = getEncryptionParams(encryption)

    if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
      await getStorageClient().putObject({
        ACL: acl,
        Body: fileBufferOrStream,
        Bucket: bucket,
        ContentType: file.mimeType,
        Key: fileKey,
        ...encryptionParams,
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
        ...encryptionParams,
      },
      partSize: multipartThreshold,
      queueSize: 4,
    })

    await parallelUploadS3.done()

    return data
  }
}
