import type { CollectionConfig, FileHandlerOperation, PayloadRequest, TypeWithID } from 'payload'

import {
  buildStoragePathData,
  getFilePrefix as getDocPrefix,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { getRangeRequestInfo, isXmlMimeType, uploadContentSecurityPolicy } from 'payload/internal'

import type { R2Bucket } from './types.js'

interface GetFileArgs {
  bucket: R2Bucket
  collection: CollectionConfig
  doc?: TypeWithID
  filename: string
  incomingHeaders?: Headers
  operation?: FileHandlerOperation
  prefix: string
  req: PayloadRequest
  uploadReference?: unknown
  useCompositePrefixes?: boolean
}

const isMiniflare = process.env.NODE_ENV === 'development'

export async function getFile({
  bucket,
  collection,
  doc,
  filename,
  incomingHeaders,
  operation = 'read',
  prefix = '',
  req,
  uploadReference,
  useCompositePrefixes = false,
}: GetFileArgs): Promise<Response> {
  const isTransformSource = operation === 'transform'

  try {
    const docPrefix = await getDocPrefix({
      collection,
      collectionPrefix: prefix,
      doc,
      filename,
      req,
      uploadReference,
      useCompositePrefixes,
    })

    const { storageFilePath } = buildStoragePathData({
      collectionPrefix: prefix,
      docPrefix,
      filename,
      useCompositePrefixes,
    })

    // Get file size for range validation
    const headObj = await bucket?.head(storageFilePath)
    if (!headObj) {
      return new Response(null, { status: 404, statusText: 'Not Found' })
    }

    const fileSize = headObj.size

    // Don't return large file uploads back to the client, or the Worker will run out of memory.
    // Skipped for `transform`, which needs the real bytes and would otherwise silently corrupt.
    if (fileSize > 50 * 1024 * 1024 && uploadReference && !isTransformSource) {
      return new Response(null, { status: 200 })
    }

    const rangeHeader = isTransformSource ? null : req.headers.get('range')
    const rangeResult = getRangeRequestInfo({ fileSize, rangeHeader })

    if (rangeResult.type === 'invalid') {
      return new Response(null, {
        headers: new Headers(rangeResult.headers),
        status: rangeResult.status,
      })
    }

    // Due to https://github.com/cloudflare/workers-sdk/issues/6047
    // We cannot send a Headers instance to Miniflare
    const obj =
      rangeResult.type === 'partial' && !isMiniflare
        ? await bucket?.get(storageFilePath, {
            range: {
              length: rangeResult.rangeEnd - rangeResult.rangeStart + 1,
              offset: rangeResult.rangeStart,
            },
          })
        : await bucket?.get(storageFilePath)

    if (!obj || obj.body == undefined) {
      return new Response(null, { status: 404, statusText: 'Not Found' })
    }

    let headers = new Headers(incomingHeaders)

    for (const [headerKey, value] of Object.entries(rangeResult.headers)) {
      headers.append(headerKey, value)
    }

    if (isMiniflare) {
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

    const contentType = headers.get('Content-Type')

    // Apply a restrictive policy to XML-family responses served through Payload.
    if (isXmlMimeType(contentType)) {
      headers.set('Content-Security-Policy', uploadContentSecurityPolicy)
    }

    const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')

    if (
      !isTransformSource &&
      collection.upload &&
      typeof collection.upload === 'object' &&
      typeof collection.upload.modifyResponseHeaders === 'function'
    ) {
      headers = collection.upload.modifyResponseHeaders({ headers }) || headers
    }

    if (!isTransformSource && etagFromHeaders && etagFromHeaders === obj.etag) {
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
