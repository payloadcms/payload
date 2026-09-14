import type { CollectionConfig, PayloadRequest, TypeWithID } from 'payload'

import { getFilePrefix as getDocPrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import { BlobNotFoundError, head } from '@vercel/blob'
import { getRangeRequestInfo, isXmlMimeType, uploadContentSecurityPolicy } from 'payload/internal'

import { generateURL } from './generateURL.js'

interface GetFileArgs {
  baseUrl: string
  cacheControlMaxAge: number
  collection: CollectionConfig
  collectionPrefix?: string
  doc?: TypeWithID
  filename: string
  incomingHeaders?: Headers
  prefixQueryParam?: string
  req: PayloadRequest
  token: string
  uploadReference?: unknown
  useCompositePrefixes?: boolean
}

export async function getFile({
  baseUrl,
  cacheControlMaxAge,
  collection,
  collectionPrefix = '',
  doc,
  filename,
  incomingHeaders,
  prefixQueryParam,
  req,
  token,
  uploadReference,
  useCompositePrefixes = false,
}: GetFileArgs): Promise<Response> {
  try {
    const docPrefix = await getDocPrefix({
      collection,
      doc,
      filename,
      prefixQueryParam,
      req,
      uploadReference,
    })

    const fileUrl = generateURL({
      baseUrl,
      collectionPrefix,
      filename,
      prefix: docPrefix,
      useCompositePrefixes,
    })
    const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
    const blobMetadata = await head(fileUrl, { token })
    const { contentDisposition, contentType, size, uploadedAt } = blobMetadata
    const uploadedAtString = uploadedAt.toISOString()
    const fileKeyForETag = fileUrl.replace(`${baseUrl}/`, '')
    const ETag = `"${fileKeyForETag}-${uploadedAtString}"`

    // Handle range request
    const rangeHeader = req.headers.get('range')
    const rangeResult = getRangeRequestInfo({ fileSize: size, rangeHeader })

    if (rangeResult.type === 'invalid') {
      return new Response(null, {
        headers: new Headers(rangeResult.headers),
        status: rangeResult.status,
      })
    }

    let headers = new Headers(incomingHeaders)

    // Add range-related headers from the result
    for (const [key, value] of Object.entries(rangeResult.headers)) {
      headers.append(key, value)
    }

    headers.append('Cache-Control', `public, max-age=${cacheControlMaxAge}`)
    headers.append('Content-Disposition', contentDisposition)
    headers.append('Content-Type', contentType)
    headers.append('ETag', ETag)

    // Apply a restrictive policy to XML-family responses served through Payload.
    if (isXmlMimeType(contentType)) {
      headers.append('Content-Security-Policy', uploadContentSecurityPolicy)
    }

    if (
      collection.upload &&
      typeof collection.upload === 'object' &&
      typeof collection.upload.modifyResponseHeaders === 'function'
    ) {
      headers = collection.upload.modifyResponseHeaders({ headers }) || headers
    }

    if (etagFromHeaders && etagFromHeaders === ETag) {
      return new Response(null, {
        headers,
        status: 304,
      })
    }

    const response = await fetch(`${fileUrl}?${uploadedAtString}`, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        ...(rangeResult.type === 'partial' && {
          Range: `bytes=${rangeResult.rangeStart}-${rangeResult.rangeEnd}`,
        }),
      },
    })

    if (!response.ok || !response.body) {
      return new Response(null, { status: 204, statusText: 'No Content' })
    }

    headers.append('Last-Modified', uploadedAtString)

    return new Response(response.body, {
      headers,
      status: rangeResult.status,
    })
  } catch (err: unknown) {
    if (err instanceof BlobNotFoundError) {
      return new Response(null, { status: 404, statusText: 'Not Found' })
    }
    req.payload.logger.error({ err, msg: 'Unexpected error in staticHandler' })
    return new Response('Internal Server Error', { status: 500 })
  }
}
