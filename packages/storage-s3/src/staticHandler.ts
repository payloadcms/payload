import type * as AWS from '@aws-sdk/client-s3'
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig, PayloadRequest } from 'payload'
import type { Readable } from 'stream'

import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'
import { getRangeRequestInfo } from 'payload/internal'

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

const abortRequestAndDestroyStream = ({
  abortController,
  object,
}: {
  abortController: AbortController
  object?: AWS.GetObjectOutput
}) => {
  try {
    abortController.abort()
  } catch {
    /* noop */
  }
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

    const abortController = new AbortController()
    if (req.signal) {
      req.signal.addEventListener('abort', () => {
        abortRequestAndDestroyStream({ abortController, object })
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
            getStorageClient(),
            command,
            typeof signedDownloads === 'object' ? signedDownloads : { expiresIn: 7200 },
          )
          return Response.redirect(signedUrl, 302)
        }
      }

      // Get file size first for range validation
      const headObject = await getStorageClient().headObject({
        Bucket: bucket,
        Key: key,
      })
      const fileSize = headObject.ContentLength

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

      const rangeForS3 =
        rangeResult.type === 'partial'
          ? `bytes=${rangeResult.rangeStart}-${rangeResult.rangeEnd}`
          : undefined

      object = await getStorageClient().getObject(
        {
          Bucket: bucket,
          Key: key,
          Range: rangeForS3,
        },
        { abortSignal: abortController.signal },
      )

      if (!object.Body) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      let headers = new Headers(incomingHeaders)

      // Add range-related headers from the result
      for (const [key, value] of Object.entries(rangeResult.headers)) {
        headers.append(key, value)
      }

      headers.append('Content-Type', String(object.ContentType))
      headers.append('ETag', String(object.ETag))

      // Add Content-Security-Policy header for SVG files to prevent executable code
      if (object.ContentType === 'image/svg+xml') {
        headers.append('Content-Security-Policy', "script-src 'none'")
      }

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
      stream.on('error', (err: Error) => {
        req.payload.logger.error({
          err,
          key,
          msg: 'Error while streaming S3 object (aborting)',
        })
        abortRequestAndDestroyStream({ abortController, object })
      })

      streamed = true
      return new Response(stream, { headers, status: rangeResult.status })
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        (('name' in err && (err.name === 'NoSuchKey' || err.name === 'NotFound')) ||
          ('httpStatusCode' in err && err.httpStatusCode === 404))
      ) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    } finally {
      if (!streamed) {
        abortRequestAndDestroyStream({ abortController, object })
      }
    }
  }
}
