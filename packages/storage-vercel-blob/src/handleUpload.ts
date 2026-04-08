import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import { put } from '@vercel/blob'
import path from 'path'

import type { VercelBlobStorageOptions } from './index.js'

type HandleUploadArgs = {
  basePrefix?: string
  baseUrl: string
  prefix?: string
} & Omit<VercelBlobStorageOptions, 'collections' | 'prefix'>

export const getHandleUpload = ({
  access = 'public',
  addRandomSuffix,
  basePrefix,
  baseUrl,
  cacheControlMaxAge,
  prefix = '',
  token,
}: HandleUploadArgs): HandleUpload => {
  return async ({ data, file: { buffer, filename, mimeType } }) => {
    const fileKey = path.posix.join(
      joinPrefixes([
        { prefix: basePrefix, sanitize: false },
        data.prefix || { prefix, sanitize: false },
      ]),
      filename,
    )

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
