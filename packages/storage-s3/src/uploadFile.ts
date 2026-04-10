import type * as AWS from '@aws-sdk/client-s3'

import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import path from 'path'

interface UploadArgs {
  acl?: 'private' | 'public-read'
  bucket: string
  buffer: Buffer
  client: AWS.S3
  filename: string
  mimeType: string
  prefix: string
  tempFilePath?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export async function uploadFile({
  acl,
  bucket,
  buffer,
  client,
  filename,
  mimeType,
  prefix,
  tempFilePath,
}: UploadArgs): Promise<void> {
  const fileKey = path.posix.join(prefix, filename)

  const fileBufferOrStream = tempFilePath ? fs.createReadStream(tempFilePath) : buffer

  if (buffer.length > 0 && buffer.length < multipartThreshold) {
    await client.putObject({
      ACL: acl,
      Body: fileBufferOrStream,
      Bucket: bucket,
      ContentType: mimeType,
      Key: fileKey,
    })

    return
  }

  const parallelUploadS3 = new Upload({
    client,
    params: {
      ACL: acl,
      Body: fileBufferOrStream,
      Bucket: bucket,
      ContentType: mimeType,
      Key: fileKey,
    },
    partSize: multipartThreshold,
    queueSize: 4,
  })

  await parallelUploadS3.done()
}
