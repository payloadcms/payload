import type { ContainerClient } from '@azure/storage-blob'
import type { FileContent } from 'payload/internal'

import { AbortController } from '@azure/abort-controller'
import { getFileBuffer, getFileStream } from 'payload/internal'

interface UploadArgs {
  client: ContainerClient
  content: FileContent
  mimeType: string
  storageFilePath: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export async function uploadFile({
  client,
  content,
  mimeType,
  storageFilePath,
}: UploadArgs): Promise<void> {
  const blockBlobClient = client.getBlockBlobClient(storageFilePath)

  if (content.type === 'buffer' && content.buffer.length < multipartThreshold) {
    const buffer = await getFileBuffer(content)

    await blockBlobClient.upload(buffer, buffer.byteLength, {
      blobHTTPHeaders: { blobContentType: mimeType },
    })
    return
  }

  await blockBlobClient.uploadStream(await getFileStream(content), 4 * 1024 * 1024, 4, {
    abortSignal: AbortController.timeout(30 * 60 * 1000),
    blobHTTPHeaders: { blobContentType: mimeType },
  })
}
