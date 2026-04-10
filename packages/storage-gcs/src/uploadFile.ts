import type { Storage } from '@google-cloud/storage'

import path from 'path'

interface UploadFileArgs {
  acl?: 'Private' | 'Public'
  bucket: string
  buffer: Buffer
  client: Storage
  filename: string
  mimeType: string
  prefix: string
}

export async function uploadFile({
  acl,
  bucket,
  buffer,
  client,
  filename,
  mimeType,
  prefix,
}: UploadFileArgs): Promise<void> {
  const fileKey = path.posix.join(prefix, filename)

  const gcsFile = client.bucket(bucket).file(fileKey)
  await gcsFile.save(buffer, {
    metadata: {
      contentType: mimeType,
    },
  })

  if (acl) {
    await gcsFile[`make${acl}`]()
  }
}
