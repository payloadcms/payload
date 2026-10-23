import type { ContainerClient } from '@azure/storage-blob'
import type { FileSource } from 'payload/internal'

import { AbortController } from '@azure/abort-controller'
import { getFileBuffer, getFileStream } from 'payload/internal'

interface UploadArgs {
  client: ContainerClient
  mimeType: string
  source: FileSource
  storageFilePath: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export async function uploadFile({
  client,
  mimeType,
  source,
  storageFilePath,
}: UploadArgs): Promise<void> {
  const blockBlobClient = client.getBlockBlobClient(storageFilePath)

  if (source.type === 'buffer' && source.buffer.length < multipartThreshold) {
    const buffer = await getFileBuffer(source)

    await blockBlobClient.upload(buffer, buffer.byteLength, {
      blobHTTPHeaders: { blobContentType: mimeType },
    })
    return
  }

  await blockBlobClient.uploadStream(await getFileStream(source), 4 * 1024 * 1024, 4, {
    abortSignal: AbortController.timeout(30 * 60 * 1000),
    blobHTTPHeaders: { blobContentType: mimeType },
  })
}
