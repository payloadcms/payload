import { put } from '@vercel/blob'
import path from 'path'

import type { HandleUpload } from '../../types.js'
import type { VercelBlobAdapterUploadOptions } from './index.js'

type HandleUploadArgs = {
  baseUrl: string
  prefix?: string
  token: string
} & VercelBlobAdapterUploadOptions

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
