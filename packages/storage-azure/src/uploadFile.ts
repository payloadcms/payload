import type { ContainerClient } from '@azure/storage-blob'

import { AbortController } from '@azure/abort-controller'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

interface UploadArgs {
  buffer: Buffer
  client: ContainerClient
  filename: string
  mimeType: string
  prefix: string
  tempFilePath?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export async function uploadFile({
  buffer,
  client,
  filename,
  mimeType,
  prefix,
  tempFilePath,
}: UploadArgs): Promise<void> {
  const fileKey = path.posix.join(prefix, filename)
  const blockBlobClient = client.getBlockBlobClient(fileKey)

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
