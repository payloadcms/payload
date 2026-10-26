import type { Storage } from '@google-cloud/storage'

import { createReadStream } from 'fs'
import { pipeline } from 'stream/promises'

interface UploadFileArgs {
  acl?: 'Private' | 'Public'
  bucket: string
  buffer: Buffer
  client: Storage
  mimeType: string
  storageFilePath: string
  tempFilePath?: string
}

export async function uploadFile({
  acl,
  bucket,
  buffer,
  client,
  mimeType,
  storageFilePath,
  tempFilePath,
}: UploadFileArgs): Promise<void> {
  const gcsFile = client.bucket(bucket).file(storageFilePath)
  const metadata = { contentType: mimeType }

  if (tempFilePath) {
    await pipeline(createReadStream(tempFilePath), gcsFile.createWriteStream({ metadata }))
  } else {
    await gcsFile.save(buffer, { metadata })
  }

  if (acl) {
    await gcsFile[`make${acl}`]()
  }
}
