import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import { head } from '@vercel/blob'
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

      const fileUrl = `${baseUrl}/${path.posix.join(prefix, filename)}`

      const blobMetadata = await head(fileUrl, { token })
      if (!blobMetadata) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const { contentDisposition, contentType, size } = blobMetadata
      const response = await fetch(fileUrl)
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
        }),
        status: 200,
      })
    } catch (err: unknown) {
      req.payload.logger.error({ err, msg: 'Unexpected error in staticHandler' })
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
