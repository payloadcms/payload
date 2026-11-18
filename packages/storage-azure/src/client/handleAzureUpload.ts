'use client'
import type { OnUploadProgress } from 'payload'

import { uploadRequest } from '@payloadcms/plugin-cloud-storage/client'

// Balances upload parallelism against browser memory: `blockSize * concurrency`
// bytes are buffered in flight. Above `MAX_SINGLE_REQUEST_SIZE` the SDK uses
// Put Block + Put Block List, lifting the ~5 GB single-request ceiling to Azure's
// block-blob maximum.
const BLOCK_SIZE = 64 * 1024 * 1024
const CONCURRENCY = 4

/** The size up to which the SDK would also send one Put Blob request. */
const MAX_SINGLE_REQUEST_SIZE = 256 * 1024 * 1024

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

  // The SDK reports no progress for a single-request upload in the browser, so it is sent with
  // uploadRequest, which does. The request matches the SDK's Put Blob.
  if (file.size <= MAX_SINGLE_REQUEST_SIZE) {
    const response = await uploadRequest({
      body: file,
      headers: {
        'x-ms-blob-content-type': file.type || 'application/octet-stream',
        'x-ms-blob-type': 'BlockBlob',
      },
      method: 'PUT',
      onProgress,
      url,
    })

    if (!response.ok) {
      throw new Error(`Upload to Azure failed with status ${response.status}`)
    }

    return
  }

  // Loaded on demand so @azure/storage-blob is only pulled into the client bundle
  // when a client upload actually runs, rather than for every Azure adapter user.
  const { BlockBlobClient } = await import('@azure/storage-blob')

  const blockBlobClient = new BlockBlobClient(url)
  let loadedBytes = 0

  await blockBlobClient.uploadData(file, {
    blobHTTPHeaders: { blobContentType: file.type },
    blockSize: BLOCK_SIZE,
    concurrency: CONCURRENCY,
    maxSingleShotSize: MAX_SINGLE_REQUEST_SIZE,
    // Blocks finish in any order, so the reported total never goes backwards.
    onProgress: onProgress
      ? (progress) => {
          loadedBytes = Math.max(loadedBytes, Math.min(progress.loadedBytes, file.size))
          onProgress({ loadedBytes, totalBytes: file.size })
        }
      : undefined,
  })
}
