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

      let headers = new Headers(incomingHeaders)

      headers.append('Cache-Control', `public, max-age=${cacheControlMaxAge}`)
      headers.append('Content-Disposition', contentDisposition)
      headers.append('Content-Length', String(size))
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
        },
      })

      const blob = await response.blob()

      if (!blob) {
        return new Response(null, { status: 204, statusText: 'No Content' })
      }

      const bodyBuffer = await blob.arrayBuffer()

      headers.append('Last-Modified', uploadedAtString)

      return new Response(bodyBuffer, {
        headers,
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
