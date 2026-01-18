import type { HandleUpload } from '@ruya.sa/plugin-cloud-storage/types'
import type { CollectionConfig } from '@ruya.sa/payload'

import path from 'path'

import type { R2Bucket } from './types.js'

interface Args {
  bucket: R2Bucket
  collection: CollectionConfig
  prefix?: string
}

export const getHandleUpload = ({ bucket, prefix = '' }: Args): HandleUpload => {
  return async ({ data, file }) => {
    // Read more: https://github.com/cloudflare/workers-sdk/issues/6047#issuecomment-2691217843
    const buffer = process.env.NODE_ENV === 'development' ? new Blob([file.buffer]) : file.buffer
    await bucket.put(path.posix.join(data.prefix || prefix, file.filename), buffer, {
      httpMetadata: { contentType: file.mimeType },
    })

    return data
  }
}
