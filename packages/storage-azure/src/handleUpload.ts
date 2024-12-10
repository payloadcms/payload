import type { ContainerClient } from '@azure/storage-blob'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { AbortController } from '@azure/abort-controller'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

interface Args {
  collection: CollectionConfig
  getStorageClient: () => ContainerClient
  prefix?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB
export const getHandleUpload = ({ getStorageClient, prefix = '' }: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(data.prefix || prefix, file.filename)

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
    })

    return data
  }
}
