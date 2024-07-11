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
  return async ({ data, file: { buffer, filename, mimeType } }) => {
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
      data.filename = result.url.replace(`${baseUrl}/`, '')
    }

    return data
  }
}
