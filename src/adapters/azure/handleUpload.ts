import path from 'path'
import fs from 'fs'
import { Readable } from 'stream'
import type { ContainerClient } from '@azure/storage-blob'
import { AbortController } from '@azure/abort-controller'
import type { CollectionConfig } from 'payload/types'
import type { HandleUpload } from '../../types'

interface Args {
  collection: CollectionConfig
  getStorageClient: () => ContainerClient
  prefix?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB
export const getHandleUpload = ({ getStorageClient, prefix = '' }: Args): HandleUpload => {
  return async ({ data, file }) => {
    const blockBlobClient = getStorageClient().getBlockBlobClient(
      path.posix.join(prefix, file.filename),
    )

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
    })

    return data
  }
}
