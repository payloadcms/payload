import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

import type { R2Bucket } from './types.js'

interface Args {
  basePrefix?: string
  bucket: R2Bucket
  collection: CollectionConfig
  prefix?: string
}

export const getHandleUpload = ({ basePrefix, bucket, prefix = '' }: Args): HandleUpload => {
  return async ({ data, file }) => {
    const key = path.posix.join(
      joinPrefixes([
        { prefix: basePrefix, sanitize: false },
        data.prefix || { prefix, sanitize: false },
      ]),
      file.filename,
    )

    // Read more: https://github.com/cloudflare/workers-sdk/issues/6047#issuecomment-2691217843
    const buffer = process.env.NODE_ENV === 'development' ? new Blob([file.buffer]) : file.buffer
    await bucket.put(key, buffer, {
      httpMetadata: { contentType: file.mimeType },
    })
  }
}
