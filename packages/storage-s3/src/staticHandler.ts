import type * as AWS from '@aws-sdk/client-s3'
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig, PayloadRequest } from 'payload'
import type { Readable } from 'stream'

import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface Args {
  bucket: string
  collection: CollectionConfig
  getStorageClient: () => AWS.S3
  getResponseHeaders?: (args: { headers: HeadersInit, req: PayloadRequest }) => Headers | Promise<Headers>
}

// Type guard for NodeJS.Readable streams
const isNodeReadableStream = (body: unknown): body is Readable => {
  return (
    typeof body === 'object' &&
    body !== null &&
    'pipe' in body &&
    typeof (body as any).pipe === 'function' &&
    'destroy' in body &&
    typeof (body as any).destroy === 'function'
  )
}

// Convert a stream into a promise that resolves with a Buffer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const streamToBuffer = async (readableStream: any) => {
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export const getHandler = ({
    bucket,
    collection,
    getStorageClient,
    getResponseHeaders,
  }: Args): StaticHandler => {
  return async (req, { params: { filename } }) => {
    try {
      const prefix = await getFilePrefix({ collection, filename, req })

      const key = path.posix.join(prefix, filename)

      const object = await getStorageClient().getObject({
        Bucket: bucket,
        Key: key,
      })

      if (!object.Body) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const objectEtag = object.ETag

      const defaultHeaders: HeadersInit = {
        'Accept-Ranges': String(object.AcceptRanges),
        'Content-Length': String(object.ContentLength),
        'Content-Type': String(object.ContentType),
        ETag: String(object.ETag),
      }

      const headers = getResponseHeaders
        ? await getResponseHeaders({ headers: defaultHeaders, req })
        : new Headers(defaultHeaders)

      if (etagFromHeaders && etagFromHeaders === objectEtag) {
        const response = new Response(null, {
          headers,
          status: 304,
        })

        // Manually destroy stream before returning cached results to close socket
        if (object.Body && isNodeReadableStream(object.Body)) {
          object.Body.destroy()
        }

        return response
      }

      // On error, manually destroy stream to close socket
      if (object.Body && isNodeReadableStream(object.Body)) {
        const stream = object.Body
        stream.on('error', (err) => {
          req.payload.logger.error({
            err,
            key,
            msg: 'Error streaming S3 object, destroying stream',
          })
          stream.destroy()
        })
      }

      const bodyBuffer = await streamToBuffer(object.Body)

      return new Response(bodyBuffer, {
        headers,
        status: 200,
      })
    } catch (err) {
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
