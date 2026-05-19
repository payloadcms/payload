import type { Storage } from '@google-cloud/storage'
import type { CollectionConfig, PayloadRequest } from 'payload'

import { ApiError } from '@google-cloud/storage'
import {
  getFilePrefix as getDocPrefix,
  getFileKey,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { getRangeRequestInfo } from 'payload/internal'

interface GetFileArgs {
  bucket: string
  client: Storage
  clientUploadContext?: unknown
  collection: CollectionConfig
  collectionPrefix?: string
  filename: string
  incomingHeaders?: Headers
  prefixQueryParam?: string
  req: PayloadRequest
  useCompositePrefixes?: boolean
}

export async function getFile({
  bucket,
  client,
  clientUploadContext,
  collection,
  collectionPrefix = '',
  filename,
  incomingHeaders,
  prefixQueryParam,
  req,
  useCompositePrefixes = false,
}: GetFileArgs): Promise<Response> {
  try {
    const docPrefix = await getDocPrefix({
      clientUploadContext,
      collection,
      filename,
      prefixQueryParam,
      req,
    })

    const { fileKey } = getFileKey({
      collectionPrefix,
      docPrefix,
      filename,
      useCompositePrefixes,
    })

    const file = client.bucket(bucket).file(fileKey)

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

    // Add Content-Security-Policy header for SVG files to prevent executable code
    if (metadata.contentType === 'image/svg+xml') {
      headers.append('Content-Security-Policy', "script-src 'none'")
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
