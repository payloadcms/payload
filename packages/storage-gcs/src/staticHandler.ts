import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { ApiError, type Storage } from '@google-cloud/storage'
import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'
import { getRangeRequestInfo } from 'payload/internal'

interface Args {
  bucket: string
  collection: CollectionConfig
  getStorageClient: () => Storage
}

export const getHandler = ({ bucket, collection, getStorageClient }: Args): StaticHandler => {
  return async (req, { headers: incomingHeaders, params: { clientUploadContext, filename } }) => {
    try {
      const prefix = await getFilePrefix({ clientUploadContext, collection, filename, req })
      const file = getStorageClient().bucket(bucket).file(path.posix.join(prefix, filename))

      const [metadata] = await file.getMetadata()

      // Handle range request
      const rangeHeader = req.headers.get('range')
      const fileSize = Number(metadata.size)
      const rangeResult = getRangeRequestInfo({ fileSize, rangeHeader })

      if (rangeResult.type === 'invalid') {
        return new Response(null, {
          headers: new Headers(rangeResult.headers),
          status: rangeResult.status,
        })
      }

      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const objectEtag = metadata.etag

      let headers = new Headers(incomingHeaders)

      // Add range-related headers from the result
      for (const [key, value] of Object.entries(rangeResult.headers)) {
        headers.append(key, value)
      }

      headers.append('Content-Type', String(metadata.contentType))
      headers.append('ETag', String(metadata.etag))

      if (
        collection.upload &&
        typeof collection.upload === 'object' &&
        typeof collection.upload.modifyResponseHeaders === 'function'
      ) {
        headers = collection.upload.modifyResponseHeaders({ headers }) || headers
      }

      if (etagFromHeaders && etagFromHeaders === objectEtag) {
        return new Response(null, {
          headers,
          status: 304,
        })
      }

      // Manually create a ReadableStream for the web from a Node.js stream.
      const readableStream = new ReadableStream({
        start(controller) {
          const streamOptions =
            rangeResult.type === 'partial'
              ? { end: rangeResult.rangeEnd, start: rangeResult.rangeStart }
              : {}
          const nodeStream = file.createReadStream(streamOptions)
          nodeStream.on('data', (chunk) => {
            controller.enqueue(new Uint8Array(chunk))
          })
          nodeStream.on('end', () => {
            controller.close()
          })
          nodeStream.on('error', (err) => {
            controller.error(err)
          })
        },
      })

      return new Response(readableStream, {
        headers,
        status: rangeResult.status,
      })
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === 404) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
