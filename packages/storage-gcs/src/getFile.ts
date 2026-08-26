import type { Storage } from '@google-cloud/storage'
import type { CollectionConfig, FileHandlerOperation, PayloadRequest } from 'payload'

import { ApiError } from '@google-cloud/storage'
import {
  getFilePrefix as getDocPrefix,
  getFileKey,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { getRangeRequestInfo } from 'payload/internal'

interface GetFileArgs {
  bucket: string
  client: Storage
  collection: CollectionConfig
  collectionPrefix?: string
  filename: string
  incomingHeaders?: Headers
  operation?: FileHandlerOperation
  prefixQueryParam?: string
  req: PayloadRequest
  uploadReference?: unknown
  useCompositePrefixes?: boolean
}

export async function getFile({
  bucket,
  client,
  collection,
  collectionPrefix = '',
  filename,
  incomingHeaders,
  operation = 'read',
  prefixQueryParam,
  req,
  uploadReference,
  useCompositePrefixes = false,
}: GetFileArgs): Promise<Response> {
  const isTransformSource = operation === 'transform'

  try {
    const docPrefix = await getDocPrefix({
      collection,
      filename,
      prefixQueryParam,
      req,
      uploadReference,
    })

    const { fileKey } = getFileKey({
      collectionPrefix,
      docPrefix,
      filename,
      useCompositePrefixes,
    })

    const file = client.bucket(bucket).file(fileKey)

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

    if (metadata.contentType === 'image/svg+xml') {
      headers.append('Content-Security-Policy', "script-src 'none'")
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
