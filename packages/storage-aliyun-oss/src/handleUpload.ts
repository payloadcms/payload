import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type OSS from 'ali-oss'
import type { PutStreamOptions } from 'ali-oss'

import fs from 'fs'
import path from 'path'

interface Args {
  getStorageClient: () => OSS
  prefix?: string
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export const getHandleUpload = ({ getStorageClient, prefix = '' }: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(data.prefix || prefix, file.filename)

    const fileBufferOrStream = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : file.buffer

    if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
      if (file.tempFilePath) {
        await getStorageClient().putStream(fileKey, fileBufferOrStream, {
          mime: file.mimeType,
        } as PutStreamOptions)
      } else {
        await getStorageClient().put(fileKey, fileBufferOrStream, {
          mime: file.mimeType,
        })
      }

      return data
    }

    await getStorageClient().multipartUpload(fileKey, fileBufferOrStream, {
      mime: file.mimeType,
      parallel: 4,
      partSize: multipartThreshold,
    })

    return data
  }
}
