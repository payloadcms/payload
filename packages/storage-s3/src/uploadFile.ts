import type * as AWS from '@aws-sdk/client-s3'
import type { FileSource } from 'payload/internal'

import { Upload } from '@aws-sdk/lib-storage'
import { getFileBuffer, getFileStream } from 'payload/internal'

interface UploadArgs {
  acl?: 'private' | 'public-read'
  bucket: string
  client: AWS.S3
  mimeType: string
  source: FileSource
  storageFilePath: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export async function uploadFile({
  acl,
  bucket,
  client,
  mimeType,
  source,
  storageFilePath,
}: UploadArgs): Promise<void> {
  if (source.type === 'buffer' && source.buffer.length < multipartThreshold) {
    await client.putObject({
      ACL: acl,
      Body: await getFileBuffer(source),
      Bucket: bucket,
      ContentType: mimeType,
      Key: storageFilePath,
    })

    return
  }

  const parallelUploadS3 = new Upload({
    client,
    params: {
      ACL: acl,
      Body: await getFileStream(source),
      Bucket: bucket,
      ContentType: mimeType,
      Key: storageFilePath,
    },
    partSize: multipartThreshold,
    queueSize: 4,
  })

  await parallelUploadS3.done()
}
