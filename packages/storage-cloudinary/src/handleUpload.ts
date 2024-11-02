import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { UploadApiOptions, v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import path from 'path'
import type stream from 'stream'


interface HandleUploadArgs {
  folder: string
  collection: CollectionConfig
  getStorageClient: () => typeof cloudinary
  prefix?: string
}

const multipartThreshold = 1024 * 1024 * 99; // 99MB

export const getHandleUpload = ({ folder, getStorageClient, prefix = '' }: HandleUploadArgs): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(data.prefix || prefix, file.filename)
    const config: UploadApiOptions = {
      resource_type: 'auto',
      public_id: fileKey,
      folder: folder
    }

    const fileBufferOrStream: Buffer | stream.Readable = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : file.buffer

    if (file.buffer.length < 0) {
      console.log('file.buffer.length < 0')
      return data
    }

    if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
      await getStorageClient().uploader.upload_stream(config).end(fileBufferOrStream)
      return data
    }

    await getStorageClient().uploader.upload_chunked_stream(config).end(fileBufferOrStream)
    return data
  }
}
