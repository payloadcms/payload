import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import path from 'path'

import type { R2Bucket } from './types.js'

interface Args {
  bucket: R2Bucket
  collection: CollectionConfig
  prefix?: string
}

const isMiniflare = process.env.NODE_ENV === 'development'

export const getHandler = ({ bucket, prefix = '' }: Args): StaticHandler => {
  return async (req, { params: { filename } }) => {
    // Due to https://github.com/cloudflare/workers-sdk/issues/6047
    // We cannot send a Headers instance to Miniflare
    const obj = await bucket?.get(path.posix.join(prefix, filename), {
      range: isMiniflare ? undefined : req.headers,
    })
    if (obj?.body == undefined) {
      return new Response(null, { status: 404 })
    }

    const headers = new Headers()
    if (!isMiniflare) {
      obj.writeHttpMetadata(headers)
    }

    return obj.etag === (req.headers.get('etag') || req.headers.get('if-none-match'))
      ? new Response(null, { headers, status: 304 })
      : new Response(obj.body, { headers, status: 200 })
  }
}
