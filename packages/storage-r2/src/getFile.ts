import type { CollectionConfig, FileHandlerOperation, PayloadRequest, TypeWithID } from 'payload'

import {
  buildStoragePathData,
  getFilePrefix as getDocPrefix,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { getRangeRequestInfo, isXmlMimeType, uploadContentSecurityPolicy } from 'payload/internal'

import type { R2Bucket, R2Object } from './types.js'

interface GetFileArgs {
  bucket: R2Bucket
  collection: CollectionConfig
  doc?: TypeWithID
  filename: string
  incomingHeaders?: Headers
  isOriginal?: boolean
  operation?: FileHandlerOperation
  prefix: string
  req: PayloadRequest
  uploadReference?: unknown
  useCompositePrefixes?: boolean
}

export async function getFile({
  bucket,
  collection,
  doc,
  filename,
  incomingHeaders,
  isOriginal,
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
      isOriginal,
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

    const obj =
      rangeResult.type === 'partial'
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

    setHTTPMetadataHeaders({ headers, httpMetadata: obj.httpMetadata })

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

/**
 * Sets the headers `R2Object.writeHttpMetadata()` would. Older Miniflare versions can't pass a
 * `Headers` instance through their proxy, so this reads the plain `httpMetadata` object instead.
 */
function setHTTPMetadataHeaders({
  headers,
  httpMetadata,
}: {
  headers: Headers
  httpMetadata: R2Object['httpMetadata']
}): Headers {
  const values: Record<string, string | undefined> = {
    'Cache-Control': httpMetadata?.cacheControl,
    'Content-Disposition': httpMetadata?.contentDisposition,
    'Content-Encoding': httpMetadata?.contentEncoding,
    'Content-Language': httpMetadata?.contentLanguage,
    'Content-Type': httpMetadata?.contentType,
    Expires: httpMetadata?.cacheExpiry?.toUTCString(),
  }

  for (const [name, value] of Object.entries(values)) {
    if (value) {
      headers.set(name, value)
    }
  }

  return headers
}
