import type * as AWS from '@aws-sdk/client-s3'
import type { FileContent } from 'payload/internal'

import { Upload } from '@aws-sdk/lib-storage'
import { getFileBuffer, getFileStream } from 'payload/internal'

interface UploadArgs {
  acl?: 'private' | 'public-read'
  bucket: string
  client: AWS.S3
  content: FileContent
  mimeType: string
  storageFilePath: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export async function uploadFile({
  acl,
  bucket,
  client,
  content,
  mimeType,
  storageFilePath,
}: UploadArgs): Promise<void> {
  if (content.type === 'buffer' && content.buffer.length < multipartThreshold) {
    await client.putObject({
      ACL: acl,
      Body: await getFileBuffer(content),
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
      Body: await getFileStream(content),
      Bucket: bucket,
      ContentType: mimeType,
      Key: storageFilePath,
    },
    partSize: multipartThreshold,
    queueSize: 4,
  })

  await parallelUploadS3.done()
}
