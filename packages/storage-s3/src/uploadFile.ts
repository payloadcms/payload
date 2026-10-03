import type * as AWS from '@aws-sdk/client-s3'

import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'

interface UploadArgs {
  acl?: 'private' | 'public-read'
  bucket: string
  buffer: Buffer
  cacheControl?: string
  client: AWS.S3
  mimeType: string
  storageFilePath: string
  tempFilePath?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export async function uploadFile({
  acl,
  bucket,
  buffer,
  cacheControl,
  client,
  mimeType,
  storageFilePath,
  tempFilePath,
}: UploadArgs): Promise<void> {
  const fileBufferOrStream = tempFilePath ? fs.createReadStream(tempFilePath) : buffer

  if (buffer.length > 0 && buffer.length < multipartThreshold) {
    await client.putObject({
      ACL: acl,
      Body: fileBufferOrStream,
      Bucket: bucket,
      CacheControl: cacheControl,
      ContentType: mimeType,
      Key: storageFilePath,
    })

    return
  }

  const parallelUploadS3 = new Upload({
    client,
    params: {
      ACL: acl,
      Body: fileBufferOrStream,
      Bucket: bucket,
      CacheControl: cacheControl,
      ContentType: mimeType,
      Key: storageFilePath,
    },
    partSize: multipartThreshold,
    queueSize: 4,
  })

  await parallelUploadS3.done()
}
