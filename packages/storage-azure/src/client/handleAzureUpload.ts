'use client'
import { formatAdminURL } from 'payload/shared'

// Balances upload parallelism against browser memory: `blockSize * concurrency`
// bytes are buffered in flight (64 MiB * 4 = 256 MiB). Only used on the SDK path.
const BLOCK_SIZE = 64 * 1024 * 1024
const CONCURRENCY = 4

type HandleAzureUploadArgs = {
  apiRoute: string
  /**
   * When true, upload through the Azure Blob SDK, which splits the file into
   * blocks (Put Block + Put Block List) and lifts the ~5 GB single-request
   * limit. When false, use the legacy single Put Blob request.
   */
  chunkLargeFiles: boolean
  collectionSlug: string
  docPrefix?: string
  file: File
  serverHandlerPath: `/${string}`
  serverURL: string
  updateFilename: (value: string) => void
}

export const handleAzureUpload = async ({
  apiRoute,
  chunkLargeFiles,
  collectionSlug,
  docPrefix,
  file,
  serverHandlerPath,
  serverURL,
  updateFilename,
}: HandleAzureUploadArgs): Promise<{ prefix: string }> => {
  const endpointRoute = formatAdminURL({
    apiRoute,
    path: serverHandlerPath,
    serverURL,
  })

  const response = await fetch(endpointRoute, {
    body: JSON.stringify({
      collectionSlug,
      docPrefix,
      filename: file.name,
      mimeType: file.type,
    }),
    credentials: 'include',
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to retrieve signed URL for Azure client upload')
  }

  const {
    docPrefix: sanitizedDocPrefix,
    filename: sanitizedFilename,
    url,
  } = (await response.json()) as {
    docPrefix: string
    filename?: string
    url: string
  }

  if (sanitizedFilename && sanitizedFilename !== file.name) {
    updateFilename(sanitizedFilename)
  }

  if (chunkLargeFiles) {
    // Loaded on demand so @azure/storage-blob is only pulled into the client bundle
    // when a chunked client upload actually runs, rather than for every Azure user.
    const { BlockBlobClient } = await import('@azure/storage-blob')

    const blockBlobClient = new BlockBlobClient(url)

    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: { blobContentType: file.type },
      blockSize: BLOCK_SIZE,
      concurrency: CONCURRENCY,
    })
  } else {
    await fetch(url, {
      body: file,
      headers: {
        'Content-Length': file.size.toString(),
        'Content-Type': file.type,
        // Required for azure
        'x-ms-blob-type': 'BlockBlob',
      },
      method: 'PUT',
    })
  }

  return { prefix: sanitizedDocPrefix }
}
