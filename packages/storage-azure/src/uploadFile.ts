import type { ContainerClient } from '@azure/storage-blob'

import { AbortController } from '@azure/abort-controller'
import fs from 'fs'
import { Readable } from 'stream'

interface UploadArgs {
  buffer: Buffer
  client: ContainerClient
  mimeType: string
  storageFilePath: string
  tempFilePath?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export async function uploadFile({
  buffer,
  client,
  mimeType,
  storageFilePath,
  tempFilePath,
}: UploadArgs): Promise<void> {
  const blockBlobClient = client.getBlockBlobClient(storageFilePath)

  // when there are no temp files, or the upload is less than the threshold size, do not stream files
  if (!tempFilePath && buffer.length > 0 && buffer.length < multipartThreshold) {
    await blockBlobClient.upload(buffer, buffer.byteLength, {
      blobHTTPHeaders: { blobContentType: mimeType },
    })
    return
  }

  const fileBufferOrStream: Readable = tempFilePath
    ? fs.createReadStream(tempFilePath)
    : Readable.from(buffer)

  await blockBlobClient.uploadStream(fileBufferOrStream, 4 * 1024 * 1024, 4, {
    abortSignal: AbortController.timeout(30 * 60 * 1000),
    blobHTTPHeaders: { blobContentType: mimeType },
  })
}
