'use client'
import { formatAdminURL } from 'payload/shared'

// Balances upload parallelism against browser memory: `blockSize * concurrency`
// bytes are buffered in flight. The SDK uses a single Put Blob for small files
// and switches to Put Block + Put Block List above its single-shot threshold,
// lifting the ~5 GB single-request ceiling to Azure's block-blob maximum.
const BLOCK_SIZE = 64 * 1024 * 1024
const CONCURRENCY = 4

type HandleAzureUploadArgs = {
  apiRoute: string
  collectionSlug: string
  docPrefix?: string
  file: File
  serverHandlerPath: `/${string}`
  serverURL: string
  updateFilename: (value: string) => void
}

export const handleAzureUpload = async ({
  apiRoute,
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

  // Loaded on demand so @azure/storage-blob is only pulled into the client bundle
  // when a client upload actually runs, rather than for every Azure adapter user.
  const { BlockBlobClient } = await import('@azure/storage-blob')

  const blockBlobClient = new BlockBlobClient(url)

  await blockBlobClient.uploadData(file, {
    blobHTTPHeaders: { blobContentType: file.type },
    blockSize: BLOCK_SIZE,
    concurrency: CONCURRENCY,
  })

  return { prefix: sanitizedDocPrefix }
}
