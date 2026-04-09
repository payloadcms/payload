import type { ContainerClient } from '@azure/storage-blob'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'

import { AbortController } from '@azure/abort-controller'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import fs from 'fs'
import { Readable } from 'stream'

interface Args {
  collectionPrefix?: string
  getStorageClient: () => ContainerClient
  useCompositePrefixes?: boolean
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB
export const getHandleUpload = ({
  collectionPrefix = '',
  getStorageClient,
  useCompositePrefixes = false,
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: data.prefix,
      filename: file.filename,
      useCompositePrefixes,
    })

    const blockBlobClient = getStorageClient().getBlockBlobClient(fileKey)

    // when there are no temp files, or the upload is less than the threshold size, do not stream files
    if (!file.tempFilePath && file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
      await blockBlobClient.upload(file.buffer, file.buffer.byteLength, {
        blobHTTPHeaders: { blobContentType: file.mimeType },
      })

      return data
    }

    const fileBufferOrStream: Readable = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : Readable.from(file.buffer)

    await blockBlobClient.uploadStream(fileBufferOrStream, 4 * 1024 * 1024, 4, {
      abortSignal: AbortController.timeout(30 * 60 * 1000),
      blobHTTPHeaders: { blobContentType: file.mimeType },
    })

    return data
  }
}
