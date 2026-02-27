import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'

import { put } from '@vercel/blob'
import path from 'path'

import type { VercelBlobStorageOptions } from './index.js'

type HandleUploadArgs = {
  baseUrl: string
  prefix?: string
} & Omit<VercelBlobStorageOptions, 'collections'>

export const getHandleUpload = ({
  access = 'public',
  addRandomSuffix,
  baseUrl,
  cacheControlMaxAge,
  prefix = '',
  token,
}: HandleUploadArgs): HandleUpload => {
  return async ({ clientUploadContext, data, file: { buffer, filename, mimeType } }) => {
    // When the file was already uploaded directly by the client, skip the
    // redundant server-side upload to avoid double-writes and race conditions.
    if (clientUploadContext) {
      return data
    }

    const fileKey = path.posix.join(data.prefix || prefix, filename)

    const result = await put(fileKey, buffer, {
      access,
      addRandomSuffix,
      cacheControlMaxAge,
      contentType: mimeType,
      token,
    })

    // Get filename with suffix from returned url
    if (addRandomSuffix) {
      data.filename = decodeURIComponent(result.url.replace(`${baseUrl}/`, ''))
    }

    return data
  }
}
