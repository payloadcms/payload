import type { StaticHandler } from '@ruya.sa/plugin-cloud-storage/types'
import type { CollectionConfig } from '@ruya.sa/payload'

import { getFilePrefix } from '@ruya.sa/plugin-cloud-storage/utilities'
import { BlobNotFoundError, head } from '@vercel/blob'
import path from 'path'
import { getRangeRequestInfo } from '@ruya.sa/payload/internal'

type StaticHandlerArgs = {
  baseUrl: string
  cacheControlMaxAge?: number
  token: string
}

export const getStaticHandler = (
  { baseUrl, cacheControlMaxAge = 0, token }: StaticHandlerArgs,
  collection: CollectionConfig,
): StaticHandler => {
  return async (req, { headers: incomingHeaders, params: { clientUploadContext, filename } }) => {
    try {
      const prefix = await getFilePrefix({ clientUploadContext, collection, filename, req })
      const fileKey = path.posix.join(prefix, encodeURIComponent(filename))
      const fileUrl = `${baseUrl}/${fileKey}`
      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const blobMetadata = await head(fileUrl, { token })
      const { contentDisposition, contentType, size, uploadedAt } = blobMetadata
      const uploadedAtString = uploadedAt.toISOString()
      const ETag = `"${fileKey}-${uploadedAtString}"`

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
}
