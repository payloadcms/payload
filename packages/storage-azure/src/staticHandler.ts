import type { BlobDownloadResponseParsed, ContainerClient } from '@azure/storage-blob'
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'
import type { Readable } from 'stream'

import { RestError } from '@azure/storage-blob'
import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'
import { getRangeRequestInfo } from 'payload/internal'

const isNodeReadableStream = (
  body: BlobDownloadResponseParsed['readableStreamBody'],
): body is Readable => {
  return (
    typeof body === 'object' &&
    body !== null &&
    'pipe' in body &&
    typeof body.pipe === 'function' &&
    'destroy' in body &&
    typeof body.destroy === 'function'
  )
}

const abortRequestAndDestroyStream = ({
  abortController,
  blob,
}: {
  abortController: AbortController
  blob?: BlobDownloadResponseParsed
}) => {
  try {
    abortController.abort()
  } catch {
    /* noop */
  }
  if (blob?.readableStreamBody && isNodeReadableStream(blob.readableStreamBody)) {
    blob.readableStreamBody.destroy()
  }
}

interface Args {
  collection: CollectionConfig
  getStorageClient: () => ContainerClient
}

export const getHandler = ({ collection, getStorageClient }: Args): StaticHandler => {
  return async (req, { headers: incomingHeaders, params: { clientUploadContext, filename } }) => {
    let blob: BlobDownloadResponseParsed | undefined = undefined
    let streamed = false

    const abortController = new AbortController()
    if (req.signal) {
      req.signal.addEventListener('abort', () => {
        abortRequestAndDestroyStream({ abortController, blob })
      })
    }

    try {
      const prefix = await getFilePrefix({ clientUploadContext, collection, filename, req })
      const blockBlobClient = getStorageClient().getBlockBlobClient(
        path.posix.join(prefix, filename),
      )

      // Get file size for range validation
      const properties = await blockBlobClient.getProperties()
      const fileSize = properties.contentLength

      if (!fileSize) {
        return new Response('Internal Server Error', { status: 500 })
      }

      // Handle range request
      const rangeHeader = req.headers.get('range')
      const rangeResult = getRangeRequestInfo({ fileSize, rangeHeader })

      if (rangeResult.type === 'invalid') {
        return new Response(null, {
          headers: new Headers(rangeResult.headers),
          status: rangeResult.status,
        })
      }

      // Download with range if partial
      blob =
        rangeResult.type === 'partial'
          ? await blockBlobClient.download(
              rangeResult.rangeStart,
              rangeResult.rangeEnd - rangeResult.rangeStart + 1,
              { abortSignal: abortController.signal },
            )
          : await blockBlobClient.download(0, undefined, { abortSignal: abortController.signal })

      let headers = new Headers(incomingHeaders)

      // Add range-related headers from the result
      for (const [key, value] of Object.entries(rangeResult.headers)) {
        headers.append(key, value)
      }

      // Add Azure-specific headers
      headers.append('Content-Type', String(properties.contentType))
      if (properties.etag) {
        headers.append('ETag', String(properties.etag))
      }

      // Add Content-Security-Policy header for SVG files to prevent executable code
      if (properties.contentType === 'image/svg+xml') {
        headers.append('Content-Security-Policy', "script-src 'none'")
      }

      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')

      if (
        collection.upload &&
        typeof collection.upload === 'object' &&
        typeof collection.upload.modifyResponseHeaders === 'function'
      ) {
        headers = collection.upload.modifyResponseHeaders({ headers }) || headers
      }

      if (etagFromHeaders && etagFromHeaders === properties.etag) {
        return new Response(null, {
          headers,
          status: 304,
        })
      }

      if (!blob.readableStreamBody || !isNodeReadableStream(blob.readableStreamBody)) {
        return new Response('Internal Server Error', { status: 500 })
      }

      const stream = blob.readableStreamBody
      stream.on('error', (err: Error) => {
        req.payload.logger.error({
          err,
          msg: 'Error while streaming Azure blob (aborting)',
        })
        abortRequestAndDestroyStream({ abortController, blob })
      })

      streamed = true
      return new Response(stream, { headers, status: rangeResult.status })
    } catch (err: unknown) {
      if (err instanceof RestError && err.statusCode === 404) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    } finally {
      if (!streamed) {
        abortRequestAndDestroyStream({ abortController, blob })
      }
    }
  }
}
