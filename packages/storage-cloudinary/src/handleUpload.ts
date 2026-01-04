import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { v2 as cloudinary, UploadApiOptions } from 'cloudinary'
import type { CollectionConfig } from 'payload'
import type stream from 'stream'

import fs from 'fs'
import path from 'path'

interface HandleUploadArgs {
  collection: CollectionConfig
  folderSrc: string
  getStorageClient: () => typeof cloudinary
  prefix?: string
}

const multipartThreshold = 1024 * 1024 * 99 // 99MB

export const getHandleUpload = ({
  folderSrc,
  getStorageClient,
  prefix = '',
}: HandleUploadArgs): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(data.prefix || prefix, file.filename)
    const config: UploadApiOptions = {
      folder: folderSrc,
      public_id: fileKey,
      resource_type: 'auto',
    }

    const fileBufferOrStream: Buffer | stream.Readable = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : file.buffer

    if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
      await new Promise((resolve, reject) => {
        getStorageClient()
          .uploader.upload_stream(config, (error, result) => {
            if (error) {
              reject(new Error(`Upload error: ${error.message}`))
            }

            resolve(result)
          })
          .end(fileBufferOrStream)
      })

      return data
    }

    await new Promise((resolve, reject) => {
      getStorageClient()
        .uploader.upload_chunked_stream(config, (error, result) => {
          if (error) {
            reject(new Error(`Chunked upload error: ${error.message}`))
          }

          resolve(result)
        })
        .end(fileBufferOrStream)
    })

    return data
  }
}
