import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

import type { R2Bucket } from './types.js'

interface Args {
  bucket: R2Bucket
  collectionPrefix?: string
  useCompositePrefixes?: boolean
}

export const getHandleUpload = ({
  bucket,
  collectionPrefix = '',
  useCompositePrefixes = false,
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: data.prefix,
      filename: file.filename,
      useCompositePrefixes,
    })

    // Read more: https://github.com/cloudflare/workers-sdk/issues/6047#issuecomment-2691217843
    const buffer = process.env.NODE_ENV === 'development' ? new Blob([file.buffer]) : file.buffer
    await bucket.put(fileKey, buffer, {
      httpMetadata: { contentType: file.mimeType },
    })
  }
}
