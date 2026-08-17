import type { CollectionConfig, FileHandlerOperation, PayloadRequest } from 'payload'

import { getFilePrefix as getDocPrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import { BlobNotFoundError, head } from '@vercel/blob'
import { getRangeRequestInfo } from 'payload/internal'

import { generateURL } from './generateURL.js'

interface GetFileArgs {
  baseUrl: string
  cacheControlMaxAge: number
  collection: CollectionConfig
  collectionPrefix?: string
  filename: string
  incomingHeaders?: Headers
  operation?: FileHandlerOperation
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
  filename,
  incomingHeaders,
  operation = 'read',
  prefixQueryParam,
  req,
  token,
  uploadReference,
  useCompositePrefixes = false,
}: GetFileArgs): Promise<Response> {
  const isTransformSource = operation === 'transform'

  try {
    const docPrefix = await getDocPrefix({
      collection,
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

    const rangeHeader = isTransformSource ? null : req.headers.get('range')
    const rangeResult = getRangeRequestInfo({ fileSize: size, rangeHeader })

    if (rangeResult.type === 'invalid') {
      return new Response(null, {
        headers: new Headers(rangeResult.headers),
        status: rangeResult.status,
      })
    }

    let headers = new Headers(incomingHeaders)

    for (const [key, value] of Object.entries(rangeResult.headers)) {
      headers.append(key, value)
    }

    headers.append('Cache-Control', `public, max-age=${cacheControlMaxAge}`)
    headers.append('Content-Disposition', contentDisposition)
    headers.append('Content-Type', contentType)
    headers.append('ETag', ETag)

    if (contentType === 'image/svg+xml') {
      headers.append('Content-Security-Policy', "script-src 'none'")
    }

    if (
      !isTransformSource &&
      collection.upload &&
      typeof collection.upload === 'object' &&
      typeof collection.upload.modifyResponseHeaders === 'function'
    ) {
      headers = collection.upload.modifyResponseHeaders({ headers }) || headers
    }

    if (!isTransformSource && etagFromHeaders && etagFromHeaders === ETag) {
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
      // A transformer distinguishing "empty" from "source retrieval failed" needs
      // the real status; masking every failure as 204 is only safe for a public download.
      if (isTransformSource) {
        return new Response(null, { status: response.status, statusText: response.statusText })
      }

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
