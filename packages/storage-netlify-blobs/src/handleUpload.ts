import type { Store } from '@netlify/blobs'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'

import path from 'path'
interface HandleUploadArgs {
  store: Store
}
export const getHandleUpload = ({ store }: HandleUploadArgs): HandleUpload => {
  return async ({ data, file: { buffer, filename, mimeType } }) => {
    const fileKey = data.prefix ? path.posix.join(data.prefix, filename) : filename

    const contentLength = buffer.byteLength

    await store.set(fileKey, buffer.buffer, {
      metadata: { contentLength, contentType: mimeType },
    })

    return data
  }
}
