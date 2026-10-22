import type { FileContent } from 'payload/internal'

import { getFileBlob } from 'payload/internal'

import type { R2Bucket } from './types.js'

interface UploadFileArgs {
  bucket: R2Bucket
  content: FileContent
  mimeType: string
  storageFilePath: string
}

export async function uploadFile({
  bucket,
  content,
  mimeType,
  storageFilePath,
}: UploadFileArgs): Promise<void> {
  const body = await getFileBlob(content, mimeType)

  await bucket.put(storageFilePath, body, {
    httpMetadata: { contentType: mimeType },
  })
}
