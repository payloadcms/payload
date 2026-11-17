'use client'
import type { OnUploadProgress } from 'payload'

// Balances upload parallelism against browser memory: `blockSize * concurrency`
// bytes are buffered in flight. The SDK uses a single Put Blob for small files
// and switches to Put Block + Put Block List above its single-shot threshold,
// lifting the ~5 GB single-request ceiling to Azure's block-blob maximum.
const BLOCK_SIZE = 64 * 1024 * 1024
const CONCURRENCY = 4

type HandleAzureUploadArgs = {
  data?: unknown
  file: File
  onProgress?: OnUploadProgress
}

export const handleAzureUpload = async ({
  data,
  file,
  onProgress,
}: HandleAzureUploadArgs): Promise<void> => {
  const { url } = data as { url: string }

  // Loaded on demand so @azure/storage-blob is only pulled into the client bundle
  // when a client upload actually runs, rather than for every Azure adapter user.
  const { BlockBlobClient } = await import('@azure/storage-blob')

  const blockBlobClient = new BlockBlobClient(url)
  let loadedBytes = 0

  await blockBlobClient.uploadData(file, {
    blobHTTPHeaders: { blobContentType: file.type },
    blockSize: BLOCK_SIZE,
    concurrency: CONCURRENCY,
    // Blocks finish in any order, so the reported total never goes backwards.
    onProgress: onProgress
      ? (progress) => {
          loadedBytes = Math.max(loadedBytes, Math.min(progress.loadedBytes, file.size))
          onProgress({ loadedBytes, totalBytes: file.size })
        }
      : undefined,
  })
}
