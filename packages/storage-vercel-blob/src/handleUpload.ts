import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { put } from '@vercel/blob'

import type { VercelBlobStorageOptions } from './index.js'

type HandleUploadArgs = {
  baseUrl: string
  collectionPrefix?: string
  useCompositePrefixes?: boolean
} & Omit<VercelBlobStorageOptions, 'collections'>

export const getHandleUpload = ({
  access = 'public',
  addRandomSuffix,
  baseUrl,
  cacheControlMaxAge,
  collectionPrefix = '',
  token,
  useCompositePrefixes = false,
}: HandleUploadArgs): HandleUpload => {
  return async ({ data, file: { buffer, filename, mimeType } }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: data.prefix,
      filename,
      useCompositePrefixes,
    })

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
