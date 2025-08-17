import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig, PayloadRequest } from 'payload'
import type { Readable } from 'stream'

import * as AWS from '@aws-sdk/client-s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

export type SignedDownloadsConfig =
  | {
      /** @default 7200 */
      expiresIn?: number
      shouldUseSignedURL?(args: {
        collection: CollectionConfig
        filename: string
        req: PayloadRequest
      }): boolean | Promise<boolean>
    }
  | boolean

interface Args {
  bucket: string
  collection: CollectionConfig
  getStorageClient: () => AWS.S3
  signedDownloads?: SignedDownloadsConfig
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

const destroyStream = (object: AWS.GetObjectOutput | undefined) => {
  if (object?.Body && isNodeReadableStream(object.Body)) {
    object.Body.destroy()
  }
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
  signedDownloads,
}: Args): StaticHandler => {
  return async (req, { headers: incomingHeaders, params: { clientUploadContext, filename } }) => {
    let object: AWS.GetObjectOutput | undefined = undefined
    try {
      const prefix = await getFilePrefix({ clientUploadContext, collection, filename, req })

      const key = path.posix.join(prefix, filename)

      if (signedDownloads && !clientUploadContext) {
        let useSignedURL = true
        if (
          typeof signedDownloads === 'object' &&
          typeof signedDownloads.shouldUseSignedURL === 'function'
        ) {
          useSignedURL = await signedDownloads.shouldUseSignedURL({ collection, filename, req })
        }

        if (useSignedURL) {
          const command = new GetObjectCommand({ Bucket: bucket, Key: key })
          const signedUrl = await getSignedUrl(
            // @ts-expect-error mismatch versions
            getStorageClient(),
            command,
            typeof signedDownloads === 'object' ? signedDownloads : { expiresIn: 7200 },
          )
          return Response.redirect(signedUrl, 302)
        }
      }

      object = await getStorageClient().getObject({
        Bucket: bucket,
        Key: key,
      })

      if (!object.Body) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      let headers = new Headers(incomingHeaders)

      // Only include Content-Length when it’s present and strictly numeric.
      // This prevents "Parse Error: Invalid character in Content-Length" when providers (e.g., MinIO)
      // return undefined or a non-numeric value.
      const contentLength = String(object.ContentLength);
      if (contentLength && !isNaN(Number(contentLength))) {
        headers.append('Content-Length', contentLength);
      }

      headers.append('Content-Type', String(object.ContentType))
      headers.append('Accept-Ranges', String(object.AcceptRanges))
      headers.append('ETag', String(object.ETag))

      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const objectEtag = object.ETag

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
      if (err instanceof AWS.NoSuchKey) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    } finally {
      destroyStream(object)
    }
  }
}
