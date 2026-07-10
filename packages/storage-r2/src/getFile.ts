import type { CollectionConfig, PayloadRequest } from 'payload'

import {
  getFilePrefix as getDocPrefix,
  getFileKey,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { getRangeRequestInfo } from 'payload/internal'

import type { R2Bucket } from './types.js'

interface GetFileArgs {
  bucket: R2Bucket
  clientUploadContext?: unknown
  collection: CollectionConfig
  filename: string
  incomingHeaders?: Headers
  prefix: string
  prefixQueryParam?: string
  req: PayloadRequest
  useCompositePrefixes?: boolean
}

const isMiniflare = process.env.NODE_ENV === 'development'

export async function getFile({
  bucket,
  clientUploadContext,
  collection,
  filename,
  incomingHeaders,
  prefix = '',
  prefixQueryParam,
  req,
  useCompositePrefixes = false,
}: GetFileArgs): Promise<Response> {
  try {
    const docPrefix = await getDocPrefix({
      clientUploadContext,
      collection,
      filename,
      prefixQueryParam,
      req,
    })

    const { fileKey } = getFileKey({
      collectionPrefix: prefix,
      docPrefix,
      filename,
      useCompositePrefixes,
    })

    // Get file size for range validation
    const headObj = await bucket?.head(fileKey)
    if (!headObj) {
      return new Response(null, { status: 404, statusText: 'Not Found' })
    }

    const fileSize = headObj.size

    // Don't return large file uploads back to the client, or the Worker will run out of memory
    if (fileSize > 50 * 1024 * 1024 && clientUploadContext) {
      return new Response(null, { status: 200 })
    }

    // Handle range request
    const rangeHeader = req.headers.get('range')
    const rangeResult = getRangeRequestInfo({ fileSize, rangeHeader })

    if (rangeResult.type === 'invalid') {
      return new Response(null, {
        headers: new Headers(rangeResult.headers),
        status: rangeResult.status,
      })
    }

    // Get object with range if needed
    // Due to https://github.com/cloudflare/workers-sdk/issues/6047
    // We cannot send a Headers instance to Miniflare
    const obj =
      rangeResult.type === 'partial' && !isMiniflare
        ? await bucket?.get(fileKey, {
            range: {
              length: rangeResult.rangeEnd - rangeResult.rangeStart + 1,
              offset: rangeResult.rangeStart,
            },
          })
        : await bucket?.get(fileKey)

    if (!obj || obj.body == undefined) {
      return new Response(null, { status: 404, statusText: 'Not Found' })
    }

    let headers = new Headers(incomingHeaders)

    // Add range-related headers from the result
    for (const [headerKey, value] of Object.entries(rangeResult.headers)) {
      headers.append(headerKey, value)
    }

    // Add R2-specific headers
    if (isMiniflare) {
      // In development with Miniflare, manually set headers from httpMetadata
      const metadata = obj.httpMetadata
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

    // Add Content-Security-Policy header for SVG files to prevent executable code
    const contentType = headers.get('Content-Type')
    if (contentType === 'image/svg+xml') {
      headers.set('Content-Security-Policy', "script-src 'none'")
    }

    const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')

    if (
      collection.upload &&
      typeof collection.upload === 'object' &&
      typeof collection.upload.modifyResponseHeaders === 'function'
    ) {
      headers = collection.upload.modifyResponseHeaders({ headers }) || headers
    }

    if (etagFromHeaders && etagFromHeaders === obj.etag) {
      return new Response(null, {
        headers,
        status: 304,
      })
    }

    return new Response(obj.body, {
      headers,
      status: rangeResult.status,
    })
  } catch (_err: unknown) {
    return new Response('Internal Server Error', { status: 500 })
  }
}
