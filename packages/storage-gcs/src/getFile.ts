import type { Storage } from '@google-cloud/storage'
import type { CollectionConfig, FileHandlerOperation, PayloadRequest, TypeWithID } from 'payload'

import { ApiError } from '@google-cloud/storage'
import {
  buildStoragePathData,
  getFilePrefix as getDocPrefix,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { getRangeRequestInfo, isXmlMimeType, uploadContentSecurityPolicy } from 'payload/internal'

interface GetFileArgs {
  bucket: string
  client: Storage
  collection: CollectionConfig
  collectionPrefix?: string
  doc?: TypeWithID
  filename: string
  incomingHeaders?: Headers
  operation?: FileHandlerOperation
  req: PayloadRequest
  uploadReference?: unknown
  useCompositePrefixes?: boolean
}

export async function getFile({
  bucket,
  client,
  collection,
  collectionPrefix = '',
  doc,
  filename,
  incomingHeaders,
  operation = 'read',
  req,
  uploadReference,
  useCompositePrefixes = false,
}: GetFileArgs): Promise<Response> {
  const isTransformSource = operation === 'transform'

  try {
    const docPrefix = await getDocPrefix({
      collection,
      collectionPrefix,
      doc,
      filename,
      req,
      uploadReference,
      useCompositePrefixes,
    })

    const { storageFilePath } = buildStoragePathData({
      collectionPrefix,
      docPrefix,
      filename,
      useCompositePrefixes,
    })

    const file = client.bucket(bucket).file(storageFilePath)

    const [metadata] = await file.getMetadata()

    const rangeHeader = isTransformSource ? null : req.headers.get('range')
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

    for (const [key, value] of Object.entries(rangeResult.headers)) {
      headers.append(key, value)
    }

    headers.append('Content-Type', String(metadata.contentType))
    headers.append('ETag', String(metadata.etag))

    // Apply a restrictive policy to XML-family responses served through Payload.
    if (isXmlMimeType(metadata.contentType)) {
      headers.append('Content-Security-Policy', uploadContentSecurityPolicy)
    }

    if (
      !isTransformSource &&
      collection.upload &&
      typeof collection.upload === 'object' &&
      typeof collection.upload.modifyResponseHeaders === 'function'
    ) {
      headers = collection.upload.modifyResponseHeaders({ headers }) || headers
    }

    if (!isTransformSource && etagFromHeaders && etagFromHeaders === objectEtag) {
      return new Response(null, {
        headers,
        status: 304,
      })
    }

    const streamOptions =
      rangeResult.type === 'partial'
        ? { end: rangeResult.rangeEnd, start: rangeResult.rangeStart }
        : {}
    const nodeStream = file.createReadStream(streamOptions)

    // A consumer that stops reading (a failed transform, a disconnected client) must end the
    // GCS download too, otherwise the underlying connection stays open until it drains.
    let onAbort: (() => void) | undefined
    const removeAbortListener = () => {
      if (onAbort) {
        req.signal?.removeEventListener('abort', onAbort)
      }
    }
    const stopReading = () => {
      removeAbortListener()
      nodeStream.destroy()
    }

    const readableStream = new ReadableStream<Uint8Array>({
      cancel: stopReading,
      start(controller) {
        onAbort = () => {
          stopReading()
          controller.error(req.signal?.reason)
        }

        if (req.signal?.aborted) {
          onAbort()
          return
        }

        req.signal?.addEventListener('abort', onAbort, { once: true })

        nodeStream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        nodeStream.on('end', () => {
          removeAbortListener()
          controller.close()
        })
        nodeStream.on('error', (err) => {
          removeAbortListener()
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
