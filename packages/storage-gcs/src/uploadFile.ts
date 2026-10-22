import type { Storage } from '@google-cloud/storage'
import type { FileContent } from 'payload/internal'

import { getFileStream } from 'payload/internal'
import { pipeline } from 'stream/promises'

interface UploadFileArgs {
  acl?: 'Private' | 'Public'
  bucket: string
  content: FileContent
  client: Storage
  mimeType: string
  storageFilePath: string
}

export async function uploadFile({
  acl,
  bucket,
  content,
  client,
  mimeType,
  storageFilePath,
}: UploadFileArgs): Promise<void> {
  const gcsFile = client.bucket(bucket).file(storageFilePath)
  const metadata = { contentType: mimeType }

  await pipeline(await getFileStream(content), gcsFile.createWriteStream({ metadata }))

  if (acl) {
    await gcsFile[`make${acl}`]()
  }
}
