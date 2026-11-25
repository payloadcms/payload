import type { PayloadRequest } from '../../../types/index.js'
import type { FileSource } from '../../transformers/types.js'
import type { UploadInstructions } from '../../types.js'

import { APIError } from '../../../errors/APIError.js'
import { fetchUploadResponse, readBoundedPrefix } from '../../getFileFromUploadInstructions.js'
import { resolveByteRange } from '../../transformers/createFileSource.js'

type ByteRange = { endByte: number; startByte: number }

/**
 * A `FileSource` over a client upload that is already in storage. Each read makes one call to the
 * collection's upload handlers with a `Range` header, so only the asked bytes leave storage.
 *
 * The size is the one `getFileFromUploadInstructions` checked against storage. A partial
 * response must give the same size, so a stored object that changed after that check fails.
 */
export function createClientUploadFileSource({
  collectionSlug,
  file,
  req,
}: {
  collectionSlug: string
  /** A client upload with an upload reference. Its bytes are read from storage, not from `data`. */
  file: NonNullable<PayloadRequest['file']>
  req: PayloadRequest
}): FileSource {
  const sizeInBytes = file.size
  // Read by the name the object was stored under. Something earlier in the operation, such as a
  // hook, can rename the request file, so a verified receipt's filename comes first.
  const verifiedOriginal = req.context?._payloadVerifiedProviderOriginal as
    | { filename?: string }
    | undefined
  const storedFile: UploadInstructions['file'] = {
    filename: verifiedOriginal?.filename ?? file.name,
    mimeType: file.mimetype,
    size: sizeInBytes,
    uploadReference: file.uploadReference as UploadInstructions['file']['uploadReference'],
  }

  const fetchRange = async ({ range, signal }: { range: ByteRange; signal?: AbortSignal }) => {
    const response = await fetchUploadResponse({
      collectionSlug,
      file: storedFile,
      rangeHeader: `bytes=${range.startByte}-${range.endByte - 1}`,
      req,
      signal,
      uploadConfig: req.payload.collections[collectionSlug]!.config.upload,
    })

    assertRangeResponse({ range, response, sizeInBytes })

    return response
  }

  return {
    filename: file.name,
    mimeType: file.mimetype,
    readFileBytes: async ({ numberOfBytes, signal, startByte }) => {
      const range = resolveByteRange({ numberOfBytes, sizeInBytes, startByte })
      signal?.throwIfAborted()

      if (range.endByte === range.startByte) {
        return new Uint8Array(0)
      }

      const bytes = readRangeBytes({ range, response: await fetchRange({ range, signal }) })
      signal?.throwIfAborted()

      return bytes
    },
    sizeInBytes,
    streamFile: async ({ numberOfBytes, signal, startByte = 0 } = {}) => {
      const range = resolveByteRange({ numberOfBytes, sizeInBytes, startByte })
      signal?.throwIfAborted()

      const stream =
        range.endByte === range.startByte
          ? new ReadableStream<Uint8Array>({ start: (controller) => controller.close() })
          : streamRangeBytes({ range, response: await fetchRange({ range, signal }) })

      // Piping with a signal errors the stream and cancels the storage read when it aborts.
      return signal ? stream.pipeThrough(new TransformStream(), { signal }) : stream
    },
  }
}

const notReadableError = (): APIError => new APIError('Uploaded source is not readable.', 400)

/**
 * A handler may answer the range with a 206, or ignore it and send the whole file with a 200.
 * Any other success status, such as Vercel Blob's 204 with no body, has no bytes to read.
 */
function assertRangeResponse({
  range,
  response,
  sizeInBytes,
}: {
  range: ByteRange
  response: Response
  sizeInBytes: number
}): void {
  const expectedContentRange = `bytes ${range.startByte}-${range.endByte - 1}/${sizeInBytes}`
  const contentLength = response.headers.get('Content-Length')

  const isExpectedResponse =
    response.status === 206
      ? response.headers.get('Content-Range') === expectedContentRange
      : response.status === 200 && (contentLength === null || Number(contentLength) === sizeInBytes)

  if (!isExpectedResponse) {
    void response.body?.cancel().catch(() => {})
    throw notReadableError()
  }
}

/**
 * The bytes of the range. A partial body starts at `startByte`. A body with more bytes than the
 * range is the whole file from byte 0: R2 under Miniflare sends one with a 206, and a handler that
 * ignores the range sends one with a 200. A body with fewer bytes than asked fails.
 */
async function readRangeBytes({
  range: { endByte, startByte },
  response,
}: {
  range: ByteRange
  response: Response
}): Promise<Uint8Array> {
  const rangeLength = endByte - startByte
  // One byte more than a whole body needs, so an exact partial body is read to its end and does
  // not need a cancel, which some adapters log as an error.
  const bytes = await readBoundedPrefix({ maxBytes: endByte + 1, response })

  if (response.status === 206 && bytes.length === rangeLength) {
    return new Uint8Array(bytes)
  }

  if (bytes.length < endByte) {
    throw notReadableError()
  }

  return new Uint8Array(bytes.subarray(startByte, endByte))
}

/**
 * Streams the bytes of the range without loading them into memory. A body that ends early errors
 * the stream. An over-long partial body (R2 under Miniflare) is the whole file from byte 0. From
 * the first byte, its bytes are the range's bytes only for a range that starts at byte 0, so such a
 * body errors the stream when the range starts later.
 */
function streamRangeBytes({
  range: { endByte, startByte },
  response,
}: {
  range: ByteRange
  response: Response
}): ReadableStream<Uint8Array> {
  if (!response.body) {
    return new ReadableStream({ start: (controller) => controller.error(notReadableError()) })
  }

  const reader = response.body.getReader()
  const isPartial = response.status === 206
  const shouldFailOnExtraBytes = isPartial && startByte > 0
  let bytesToSkip = isPartial ? 0 : startByte
  let bytesToSend = endByte - startByte

  return new ReadableStream<Uint8Array>({
    cancel: (reason) => reader.cancel(reason),
    pull: async (controller) => {
      for (;;) {
        const { done, value } = await reader.read()

        if (done) {
          return bytesToSend > 0 ? controller.error(notReadableError()) : controller.close()
        }

        const skippedLength = Math.min(bytesToSkip, value.length)
        const chunk = value.subarray(skippedLength)
        const rangeChunk = chunk.subarray(0, bytesToSend)
        bytesToSkip -= skippedLength
        bytesToSend -= rangeChunk.length

        if (rangeChunk.length > 0) {
          controller.enqueue(rangeChunk)
        }

        if (chunk.length > rangeChunk.length) {
          await reader.cancel()

          return shouldFailOnExtraBytes ? controller.error(notReadableError()) : controller.close()
        }

        // The rest of a whole body is not needed. A partial body is read to its end instead, so
        // the next read can find extra bytes, and an exact body needs no cancel.
        if (bytesToSend === 0 && !isPartial) {
          await reader.cancel()

          return controller.close()
        }

        if (rangeChunk.length > 0) {
          return
        }
      }
    },
  })
}
