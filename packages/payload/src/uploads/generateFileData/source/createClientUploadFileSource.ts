import type { PayloadRequest } from '../../../types/index.js'
import type { FileSource } from '../../transformers/types.js'
import type { UploadInstructions } from '../../types.js'

import { APIError } from '../../../errors/APIError.js'
import { fetchUploadResponse } from '../../getFileFromUploadInstructions.js'
import { resolveByteRange } from '../../transformers/createFileSource.js'

type ByteRange = { endByte: number; startByte: number }

/**
 * How the upload handler answers a range, once a response showed it. `ignored` means its partial
 * responses hold the whole file from byte 0, as R2's do under Miniflare.
 */
type RangeHandling = 'honored' | 'ignored' | 'unknown'

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
}): {
  fileSource: FileSource
  /**
   * The `Content-Type` of the first storage response: `undefined` before any read, and `null`
   * when storage sent none. The download path saves this type in place of the client's claim.
   */
  getProviderContentType: () => null | string | undefined
} {
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
  const rangeHandling: { value: RangeHandling } = { value: 'unknown' }
  let providerContentType: null | string | undefined

  const getRangeChunks = async ({ range, signal }: { range: ByteRange; signal?: AbortSignal }) => {
    const response = await fetchUploadResponse({
      collectionSlug,
      file: storedFile,
      rangeHeader: `bytes=${range.startByte}-${range.endByte - 1}`,
      req,
      signal,
      uploadConfig: req.payload.collections[collectionSlug]!.config.upload,
    })

    if (providerContentType === undefined) {
      providerContentType = response.headers.get('Content-Type')
    }

    assertRangeResponse({ range, response, sizeInBytes })

    return readRangeChunks({ range, rangeHandling, response, sizeInBytes })
  }

  const fileSource: FileSource = {
    filename: file.name,
    mimeType: file.mimetype,
    readFileBytes: async ({ numberOfBytes, signal, startByte }) => {
      const range = resolveByteRange({ numberOfBytes, sizeInBytes, startByte })
      signal?.throwIfAborted()

      if (range.endByte === range.startByte) {
        return new Uint8Array(0)
      }

      const chunks: Uint8Array[] = []

      for await (const chunk of await getRangeChunks({ range, signal })) {
        chunks.push(chunk)
      }

      signal?.throwIfAborted()

      return new Uint8Array(Buffer.concat(chunks))
    },
    sizeInBytes,
    streamFile: async ({ numberOfBytes, signal, startByte = 0 } = {}) => {
      const range = resolveByteRange({ numberOfBytes, sizeInBytes, startByte })
      signal?.throwIfAborted()

      const stream =
        range.endByte === range.startByte
          ? new ReadableStream<Uint8Array>({ start: (controller) => controller.close() })
          : toReadableStream({ chunks: await getRangeChunks({ range, signal }) })

      // Piping with a signal errors the stream and cancels the storage read when it aborts.
      return signal ? stream.pipeThrough(new TransformStream(), { signal }) : stream
    },
  }

  return { fileSource, getProviderContentType: () => providerContentType }
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
    response.body !== null &&
    (response.status === 206
      ? response.headers.get('Content-Range') === expectedContentRange
      : response.status === 200 &&
        (contentLength === null || Number(contentLength) === sizeInBytes))

  if (!isExpectedResponse) {
    void response.body?.cancel().catch(() => {})
    throw notReadableError()
  }
}

/**
 * The bytes of the range, from a response body, without loading more than one chunk at a time.
 *
 * A partial body starts at `startByte`. A whole body starts at byte 0: a handler that ignores the
 * range sends one with a 200, and R2 under Miniflare sends one with a 206. Such a 206 is found when
 * its body has more bytes than the range. From then on, `rangeHandling` is `ignored` and each 206
 * is read as a whole body. Before that is known, a range from a later byte is held in memory until
 * the body shows which kind it is. A body with fewer bytes than asked fails.
 */
async function* readRangeChunks({
  range: { endByte, startByte },
  rangeHandling,
  response,
  sizeInBytes,
}: {
  range: ByteRange
  rangeHandling: { value: RangeHandling }
  response: Response
  sizeInBytes: number
}): AsyncGenerator<Uint8Array> {
  const reader = response.body!.getReader()
  const rangeLength = endByte - startByte
  const isPartial = response.status === 206
  // A response for the whole file looks the same whether or not the handler honours the range.
  const isWholeFileRange = startByte === 0 && endByte === sizeInBytes
  const heldChunks: Uint8Array[] = []
  let isWholeBody = !isPartial || rangeHandling.value === 'ignored'

  try {
    // From byte 0 the two kinds of body start with the same bytes, so only a later byte waits.
    if (!isWholeBody && rangeHandling.value === 'unknown' && startByte > 0) {
      let heldLength = 0

      while (heldLength <= rangeLength) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        heldChunks.push(value)
        heldLength += value.length
      }

      isWholeBody = heldLength > rangeLength
    }

    if (isPartial && isWholeBody) {
      rangeHandling.value = 'ignored'
    }

    let bytesToSkip = isWholeBody ? startByte : 0
    let bytesToSend = rangeLength

    for (;;) {
      const { done, value } = heldChunks.length
        ? { done: false as const, value: heldChunks.shift()! }
        : await reader.read()

      if (done) {
        if (bytesToSend > 0) {
          throw notReadableError()
        }

        if (isPartial && !isWholeBody && !isWholeFileRange) {
          rangeHandling.value = 'honored'
        }

        return
      }

      const skippedLength = Math.min(bytesToSkip, value.length)
      const chunk = value.subarray(skippedLength)
      const rangeChunk = chunk.subarray(0, bytesToSend)
      bytesToSkip -= skippedLength
      bytesToSend -= rangeChunk.length

      if (rangeChunk.length > 0) {
        yield rangeChunk
      }

      // The rest of a whole body is not needed.
      if (isWholeBody && bytesToSend === 0) {
        return
      }

      if (chunk.length > rangeChunk.length) {
        // A partial body with more bytes than the range. From byte 0 it is a whole body, and the
        // bytes sent are right. A later byte gets here only after earlier responses had only the
        // range. The bytes sent may then be the file's first bytes, so the read fails.
        if (startByte > 0) {
          throw notReadableError()
        }

        rangeHandling.value = 'ignored'

        return
      }
    }
  } finally {
    // cancel is a no-op on a finished body, so an exact range does not trigger adapter cancel logs.
    await reader.cancel().catch(() => {})
  }
}

/** A stream that pulls each chunk from `chunks`, and stops the reads when it is cancelled. */
function toReadableStream({
  chunks,
}: {
  chunks: AsyncGenerator<Uint8Array>
}): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    cancel: async () => {
      await chunks.return(undefined)
    },
    pull: async (controller) => {
      try {
        const { done, value } = await chunks.next()

        if (done) {
          controller.close()
        } else {
          controller.enqueue(value)
        }
      } catch (error) {
        controller.error(error)
      }
    },
  })
}
