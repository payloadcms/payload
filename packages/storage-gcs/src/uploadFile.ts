import type { Storage } from '@google-cloud/storage'
import type { FileSource } from 'payload/internal'

import { getFileStream } from 'payload/internal'
import { pipeline } from 'stream/promises'

interface UploadFileArgs {
  acl?: 'Private' | 'Public'
  bucket: string
  client: Storage
  mimeType: string
  source: FileSource
  storageFilePath: string
}

export async function uploadFile({
  acl,
  bucket,
  client,
  mimeType,
  source,
  storageFilePath,
}: UploadFileArgs): Promise<void> {
  const gcsFile = client.bucket(bucket).file(storageFilePath)
  const metadata = { contentType: mimeType }

  await pipeline(await getFileStream(source), gcsFile.createWriteStream({ metadata }))

  if (acl) {
    await gcsFile[`make${acl}`]()
  }
}
