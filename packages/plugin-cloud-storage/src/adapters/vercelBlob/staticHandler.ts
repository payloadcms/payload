import type { CollectionConfig } from 'payload'

import { head } from '@vercel/blob'
import path from 'path'

import type { StaticHandler } from '../../types.js'

import { getFilePrefix } from '../../utilities/getFilePrefix.js'

type StaticHandlerArgs = {
  baseUrl: string
  token: string
}

export const getStaticHandler = (
  { baseUrl, token }: StaticHandlerArgs,
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
