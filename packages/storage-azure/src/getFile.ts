import type { BlobDownloadResponseParsed, ContainerClient } from '@azure/storage-blob'
import type { CollectionConfig, FileHandlerOperation, PayloadRequest } from 'payload'
import type { Readable } from 'stream'

import { RestError } from '@azure/storage-blob'
import {
  getFilePrefix as getDocPrefix,
  getFileKey,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { getRangeRequestInfo } from 'payload/internal'

interface GetFileArgs {
  client: ContainerClient
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

export async function getFile({
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
  let blob: BlobDownloadResponseParsed | undefined = undefined
  let streamed = false

  const abortController = new AbortController()
  if (req.signal) {
    req.signal.addEventListener('abort', () => {
      abortRequestAndDestroyStream({ abortController, blob })
    })
  }

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

    const blockBlobClient = client.getBlockBlobClient(fileKey)

    const properties = await blockBlobClient.getProperties()
    const fileSize = properties.contentLength

    if (!fileSize) {
      return new Response('Internal Server Error', { status: 500 })
    }

    const rangeHeader = isTransformSource ? null : req.headers.get('range')
    const rangeResult = getRangeRequestInfo({ fileSize, rangeHeader })

    if (rangeResult.type === 'invalid') {
      return new Response(null, {
        headers: new Headers(rangeResult.headers),
        status: rangeResult.status,
      })
    }

    blob =
      rangeResult.type === 'partial'
        ? await blockBlobClient.download(
            rangeResult.rangeStart,
            rangeResult.rangeEnd - rangeResult.rangeStart + 1,
            { abortSignal: abortController.signal },
          )
        : await blockBlobClient.download(0, undefined, { abortSignal: abortController.signal })

    let headers = new Headers(incomingHeaders)

    for (const [key, value] of Object.entries(rangeResult.headers)) {
      headers.append(key, value)
    }

    headers.append('Content-Type', String(properties.contentType))
    if (properties.etag) {
      headers.append('ETag', String(properties.etag))
    }

    if (properties.contentType === 'image/svg+xml') {
      headers.append('Content-Security-Policy', "script-src 'none'")
    }

    const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')

    if (
      !isTransformSource &&
      collection.upload &&
      typeof collection.upload === 'object' &&
      typeof collection.upload.modifyResponseHeaders === 'function'
    ) {
      headers = collection.upload.modifyResponseHeaders({ headers }) || headers
    }

    if (!isTransformSource && etagFromHeaders && etagFromHeaders === properties.etag) {
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
