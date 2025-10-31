import type * as AWS from '@aws-sdk/client-s3'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import path from 'path'

import { versioningField } from './versionField.js'

interface Args {
  acl?: 'private' | 'public-read'
  bucket: string
  collection: CollectionConfig
  getStorageClient: () => AWS.S3
  prefix?: string
  versionFieldEnabled?: boolean
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export const getHandleUpload = ({
  acl,
  bucket,
  getStorageClient,
  prefix = '',
  versionFieldEnabled,
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(data.prefix || prefix, file.filename)

    const fileBufferOrStream = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : file.buffer

    if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
      const output = await getStorageClient().putObject({
        ACL: acl,
        Body: fileBufferOrStream,
        Bucket: bucket,
        ContentType: file.mimeType,
        Key: fileKey,
      })

      if (versionFieldEnabled && output.VersionId) {
        data[versioningField.name] = output.VersionId
      }

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

    const output = await parallelUploadS3.done()

    if (versionFieldEnabled && output.VersionId) {
      data[versioningField.name] = output.VersionId
    }

    return data
  }
}
