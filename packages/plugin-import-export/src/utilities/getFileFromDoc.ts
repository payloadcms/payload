import type { CollectionConfig, FileData, PayloadRequest, UploadConfig } from 'payload'

import { getFileByPath } from 'payload'
import { getExternalFile } from 'payload/internal'

type Args = {
  collectionConfig: CollectionConfig
  doc: { filename: string; mimeType?: string; url?: string }
  req: PayloadRequest
}

type Result = {
  data: Buffer
  mimetype: string
}

/**
 * Retrieves file data from an uploaded document, handling both local storage
 * and cloud storage (S3, Azure, GCS, etc.) scenarios correctly.
 *
 * This function uses the same pattern as Payload's internal file retrieval:
 * - For local storage: reads directly from disk (efficient, no HTTP roundtrip)
 * - For cloud storage: fetches via Payload's file endpoint, which triggers
 *   the storage adapter's staticHandler to serve the file
 */
export const getFileFromDoc = async ({ collectionConfig, doc, req }: Args): Promise<Result> => {
  const uploadConfig: UploadConfig =
    typeof collectionConfig.upload === 'object' ? collectionConfig.upload : {}
  const disableLocalStorage = uploadConfig.disableLocalStorage ?? false
  const staticDir = uploadConfig.staticDir || collectionConfig.slug

  const serverURL = req.payload.config.serverURL
  const isLocalFile = (serverURL && doc.url?.startsWith(serverURL)) || doc.url?.startsWith('/')

  if (!disableLocalStorage && isLocalFile && doc.filename) {
    // Local storage enabled - read directly from disk (efficient, no HTTP roundtrip)
    const filePath = `${staticDir}/${doc.filename}`
    const file = await getFileByPath(filePath)

    if (!file) {
      throw new Error(`File not found at path: ${filePath}`)
    }

    return {
      data: file.data,
      mimetype: file.mimetype || doc.mimeType || 'application/octet-stream',
    }
  }

  if (doc.filename && doc.url) {
    // Cloud storage or external - fetch via Payload's file endpoint
    // getExternalFile constructs full URL, includes cookies for auth, and
    // the request goes through Payload's handler chain (including storage adapter)
    const file = await getExternalFile({
      data: { filename: doc.filename, url: doc.url } as FileData,
      req,
      uploadConfig,
    })

    return {
      data: file.data,
      mimetype: file.mimetype || doc.mimeType || 'application/octet-stream',
    }
  }

  throw new Error('Unable to retrieve file: missing filename or url')
}
