import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import { BlobNotFoundError, head } from '@vercel/blob'
import path from 'path'

type StaticHandlerArgs = {
  baseUrl: string
  cacheControlMaxAge?: number
  token: string
}

export const getStaticHandler = (
  { baseUrl, cacheControlMaxAge = 0, token }: StaticHandlerArgs,
  collection: CollectionConfig,
): StaticHandler => {
  return async (req, { params: { filename } }) => {
    try {
      const prefix = await getFilePrefix({ collection, filename, req })
      const fileKey = path.posix.join(prefix, encodeURIComponent(filename))

      const fileUrl = `${baseUrl}/${fileKey}`
      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const blobMetadata = await head(fileUrl, { token })
      const uploadedAtString = blobMetadata.uploadedAt.toISOString()
      const ETag = `"${fileKey}-${uploadedAtString}"`

      const { contentDisposition, contentType, size } = blobMetadata

      if (etagFromHeaders && etagFromHeaders === ETag) {
        return new Response(null, {
          headers: new Headers({
            'Cache-Control': `public, max-age=${cacheControlMaxAge}`,
            'Content-Disposition': contentDisposition,
            'Content-Length': String(size),
            'Content-Type': contentType,
            ETag,
          }),
          status: 304,
        })
      }

      const response = await fetch(`${fileUrl}?${uploadedAtString}`, {
        cache: 'no-store',
      })

      const blob = await response.blob()

      if (!blob) {
        return new Response(null, { status: 204, statusText: 'No Content' })
      }

      const bodyBuffer = await blob.arrayBuffer()

      return new Response(bodyBuffer, {
        headers: new Headers({
          'Cache-Control': `public, max-age=${cacheControlMaxAge}`,
          'Content-Disposition': contentDisposition,
          'Content-Length': String(size),
          'Content-Type': contentType,
          ETag,
          'Last-Modified': blobMetadata.uploadedAt.toUTCString(),
        }),
        status: 200,
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
