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

/** Retries of a single-request upload after a temporary failure, as the SDK would. */
const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 1000

const isTemporaryFailure = (status: number) => status === 408 || status === 429 || status >= 500

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
    await uploadSingleRequest({ file, onProgress, url })
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

/**
 * Sends the file as one Put Blob request. Temporary failures are retried with exponential backoff,
 * as the SDK's retry policy does; other failures end the upload. A retry sends the file again, so
 * reported progress keeps its highest value.
 */
const uploadSingleRequest = async ({
  file,
  onProgress,
  url,
}: {
  file: File
  onProgress?: OnUploadProgress
  url: string
}): Promise<void> => {
  let loadedBytes = 0
  const reportProgress: OnUploadProgress | undefined = onProgress
    ? (progress) => {
        loadedBytes = Math.max(loadedBytes, progress.loadedBytes)
        onProgress({ loadedBytes, totalBytes: progress.totalBytes })
      }
    : undefined

  for (let attempt = 0; ; attempt++) {
    let response: Response | undefined
    let networkError: unknown

    try {
      response = await uploadRequest({
        body: file,
        headers: {
          'x-ms-blob-content-type': file.type || 'application/octet-stream',
          'x-ms-blob-type': 'BlockBlob',
        },
        method: 'PUT',
        onProgress: reportProgress,
        url,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err
      }

      networkError = err
    }

    if (response?.ok) {
      return
    }

    const failure = response
      ? new Error(`Upload to Azure failed with status ${response.status}`)
      : networkError instanceof Error
        ? networkError
        : new Error('Upload to Azure failed because of a network error.')

    if ((response && !isTemporaryFailure(response.status)) || attempt >= MAX_RETRIES) {
      throw failure
    }

    await new Promise((resolve) => setTimeout(resolve, BASE_RETRY_DELAY_MS * 2 ** attempt))
  }
}
