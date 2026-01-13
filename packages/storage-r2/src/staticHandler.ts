import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import path from 'path'

import type { R2Bucket, R2ObjectBody } from './types.js'

interface Args {
  bucket: R2Bucket
  collection: CollectionConfig
  prefix?: string
}

const isMiniflare = process.env.NODE_ENV === 'development'

export const getHandler = ({ bucket, prefix = '' }: Args): StaticHandler => {
  return async (req, { params: { clientUploadContext, filename } }) => {
    // Due to https://github.com/cloudflare/workers-sdk/issues/6047
    // We cannot send a Headers instance to Miniflare
    const obj: R2ObjectBody = await bucket?.get(path.posix.join(prefix, filename), {
      range: isMiniflare ? undefined : req.headers,
    })

    if (obj?.body == undefined) {
      return new Response(null, { status: 404 })
    }
    // Don't return large file uploads back to the client, or the Worker will run out of memory
    if (obj?.size > 50 * 1024 * 1024 && clientUploadContext) {
      return new Response(null, { status: 200 })
    }

    const headers = new Headers()
    const metadata = obj.httpMetadata

    if (isMiniflare) {
      if (metadata?.cacheControl) {
        headers.set('Cache-Control', metadata.cacheControl)
      }
      if (metadata?.contentDisposition) {
        headers.set('Content-Disposition', metadata.contentDisposition)
      }
      if (metadata?.contentEncoding) {
        headers.set('Content-Encoding', metadata.contentEncoding)
      }
      if (metadata?.contentLanguage) {
        headers.set('Content-Language', metadata.contentLanguage)
      }
      if (metadata?.contentType) {
        headers.set('Content-Type', metadata.contentType)
      }
    } else {
      obj.writeHttpMetadata(headers)
    }

    return obj.etag === (req.headers.get('etag') || req.headers.get('if-none-match'))
      ? new Response(null, { headers, status: 304 })
      : new Response(obj.body, { headers, status: 200 })
  }
}
