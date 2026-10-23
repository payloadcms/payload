import type { FileSource } from 'payload/internal'

import { getFileBlob } from 'payload/internal'

import type { R2Bucket } from './types.js'

interface UploadFileArgs {
  bucket: R2Bucket
  mimeType: string
  source: FileSource
  storageFilePath: string
}

export async function uploadFile({
  bucket,
  mimeType,
  source,
  storageFilePath,
}: UploadFileArgs): Promise<void> {
  const body = await getFileBlob(source, mimeType)

  await bucket.put(storageFilePath, body, {
    httpMetadata: { contentType: mimeType },
  })
}
