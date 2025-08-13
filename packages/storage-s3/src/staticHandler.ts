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

const isNodeReadableStream = (body: AWS.GetObjectOutput['Body']): body is Readable => {
  return (
    typeof body === 'object' &&
    body !== null &&
    'pipe' in body &&
    typeof body.pipe === 'function' &&
    'destroy' in body &&
    typeof body.destroy === 'function'
  )
}

const destroyStream = (object: AWS.GetObjectOutput | undefined) => {
  if (object?.Body && isNodeReadableStream(object.Body)) {
    object.Body.destroy()
  }
}

export const getHandler = ({
  bucket,
  collection,
  getStorageClient,
  signedDownloads,
}: Args): StaticHandler => {
  return async (req, { headers: incomingHeaders, params: { clientUploadContext, filename } }) => {
    let object: AWS.GetObjectOutput | undefined = undefined
    let streamed = false

    const s3AbortController = new AbortController()
    if (req.signal) {
      req.signal.addEventListener('abort', () => {
        try {
          s3AbortController.abort()
        } catch {
          /* noop */
        }
        destroyStream(object)
      })
    }

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

      object = await getStorageClient().getObject(
        {
          Bucket: bucket,
          Key: key,
        },
        { abortSignal: s3AbortController.signal },
      )

      if (!object.Body) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      let headers = new Headers(incomingHeaders)

      headers.append('Content-Length', String(object.ContentLength))
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

      if (!isNodeReadableStream(object.Body)) {
        req.payload.logger.error({
          key,
          msg: 'S3 object body is not a readable stream',
        })
        return new Response('Internal Server Error', { status: 500 })
      }

      const stream = object.Body
      stream.on('error', (err) => {
        req.payload.logger.error({
          err,
          key,
          msg: 'Error while streaming S3 object (aborting)',
        })
        try {
          s3AbortController.abort()
        } catch {
          /* noop */
        }
        stream.destroy(err)
      })

      streamed = true
      return new Response(stream, { headers, status: 200 })
    } catch (err) {
      if (err instanceof AWS.NoSuchKey) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    } finally {
      if (!streamed) {
        try {
          s3AbortController.abort()
        } catch {
          /* noop */
        }
        destroyStream(object)
      }
    }
  }
}
