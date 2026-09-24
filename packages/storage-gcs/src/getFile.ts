import type { Storage } from '@google-cloud/storage'
import type { CollectionConfig, PayloadRequest, TypeWithID } from 'payload'

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
  req,
  uploadReference,
  useCompositePrefixes = false,
}: GetFileArgs): Promise<Response> {
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

    // Apply a restrictive policy to XML-family responses served through Payload.
    if (isXmlMimeType(metadata.contentType)) {
      headers.append('Content-Security-Policy', uploadContentSecurityPolicy)
    }

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
    let nodeStream: ReturnType<typeof file.createReadStream> | undefined
    let cancelled = false
    const destroyNodeStream = () => {
      cancelled = true
      nodeStream?.destroy()
    }
    // Stop the GCS download when the incoming request is aborted, mirroring
    // the storage-s3 and storage-azure adapters.
    if (req.signal) {
      req.signal.addEventListener('abort', destroyNodeStream, { once: true })
    }
    const readableStream = new ReadableStream({
      start(controller) {
        const streamOptions =
          rangeResult.type === 'partial'
            ? { end: rangeResult.rangeEnd, start: rangeResult.rangeStart }
            : {}
        nodeStream = file.createReadStream(streamOptions)
        nodeStream.on('data', (chunk) => {
          if (cancelled) return
          controller.enqueue(new Uint8Array(chunk))
        })
        nodeStream.on('end', () => {
          if (cancelled) return
          controller.close()
        })
        nodeStream.on('error', (err) => {
          if (cancelled) return
          controller.error(err)
        })
      },
      cancel() {
        // The client stopped reading: destroy the GCS stream so it stops
        // pushing chunks into the closed controller (and leaking memory).
        destroyNodeStream()
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
