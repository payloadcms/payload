import type { ReadableStream } from 'node:stream/web'

import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import type { PayloadRequest } from '../types/index.js'
import type { SanitizedUploadConfig, UploadInstructions } from './types.js'

import { APIError } from '../errors/APIError.js'
import { getFileContentRequirement, HEADER_PROBE_BYTE_LENGTH } from './getFileContentRequirement.js'
import { getImageSize } from './getImageSize.js'
import { getStagedFile } from './stagedUpload.js'

export const getFileFromUploadInstructions = async ({
  collectionSlug,
  file,
  req,
}: {
  collectionSlug: string
  file: UploadInstructions['file']
  req: PayloadRequest
}): Promise<NonNullable<PayloadRequest['file']>> => {
  if (
    !file ||
    typeof file !== 'object' ||
    !file.uploadReference ||
    typeof file.uploadReference !== 'object'
  ) {
    throw new APIError('Invalid upload reference.', 400)
  }

  /**
   * Handlers fetch files uploaded to a storage provider. An uploadId points to a temporary file
   * already stored by Payload, so no handler is needed.
   */
  if ('uploadId' in file.uploadReference) {
    return getStagedFile({ collectionSlug, req, uploadReference: file.uploadReference })
  }

  const uploadConfig = req.payload.collections[collectionSlug]!.config.upload

  if (!uploadConfig || !uploadConfig.handlers) {
    throw new APIError('uploadConfig.handlers is not present for ' + collectionSlug)
  }

  const contentRequirement = getFileContentRequirement({ mimeType: file.mimeType, uploadConfig })

  // Nothing downstream reads this file's content - use the client-reported metadata directly
  // instead of re-downloading a file that, for a chunked upload, can be far larger than
  // the server's available memory or disk.
  if (contentRequirement === 'none') {
    return {
      name: file.filename,
      data: Buffer.alloc(0),
      mimetype: file.mimeType,
      size: file.size,
      uploadReference: file.uploadReference,
    }
  }

  if (contentRequirement === 'header') {
    const headerFile = await fetchHeaderOnly({ collectionSlug, file, req, uploadConfig })
    if (headerFile) {
      return headerFile
    }
    // The header wasn't enough to determine the image's dimensions - fall through to a full fetch.
  }

  const response = await fetchUploadResponse({ collectionSlug, file, req, uploadConfig })

  const tempFilePath = await streamResponseToTempFile({ req, response })

  return {
    name: file.filename,
    data: Buffer.alloc(0),
    mimetype: response.headers.get('Content-Type') || file.mimeType,
    size: file.size,
    tempFilePath,
    uploadReference: file.uploadReference,
  }
}

/**
 * Fetches only the first `HEADER_PROBE_BYTE_LENGTH` bytes of the upload (via a best-effort byte
 * range request) and uses them to probe an image's dimensions, without downloading the rest of
 * the file. Returns null if that isn't enough to determine the dimensions, so the caller can
 * fall back to a full fetch.
 */
const fetchHeaderOnly = async ({
  collectionSlug,
  file,
  req,
  uploadConfig,
}: {
  collectionSlug: string
  file: UploadInstructions['file']
  req: PayloadRequest
  uploadConfig: SanitizedUploadConfig
}): Promise<NonNullable<PayloadRequest['file']> | null> => {
  const response = await fetchUploadResponse({
    collectionSlug,
    file,
    rangeHeader: `bytes=0-${HEADER_PROBE_BYTE_LENGTH - 1}`,
    req,
    uploadConfig,
  })

  const headerBuffer = await readBoundedPrefix(response, HEADER_PROBE_BYTE_LENGTH)

  try {
    await getImageSize({
      file: {
        name: file.filename,
        data: headerBuffer,
        mimetype: file.mimeType,
        size: file.size,
      },
      sharp: req.payload.config.sharp,
    })
  } catch {
    return null
  }

  return {
    name: file.filename,
    data: headerBuffer,
    mimetype: response.headers.get('Content-Type') || file.mimeType,
    size: file.size,
    uploadReference: file.uploadReference,
  }
}

/**
 * Runs the collection's upload handlers, following a single redirect if one is returned.
 * `rangeHeader`, when passed, is a best-effort hint - handlers that ignore it simply return the
 * full file, which callers must still bound their own reads against.
 */
const fetchUploadResponse = async ({
  collectionSlug,
  file,
  rangeHeader,
  req,
  uploadConfig,
}: {
  collectionSlug: string
  file: UploadInstructions['file']
  rangeHeader?: string
  req: PayloadRequest
  uploadConfig: SanitizedUploadConfig
}): Promise<Response> => {
  const scopedReq = rangeHeader ? withRangeHeader(req, rangeHeader) : req

  let response: null | Response = null
  let error: unknown

  for (const handler of uploadConfig.handlers!) {
    try {
      const result = await handler(scopedReq, {
        doc: null!,
        params: {
          collection: collectionSlug,
          filename: file.filename,
          uploadReference: file.uploadReference,
        },
      })
      if (result) {
        response = result
        /**
         * - If a handler returns a Response, the response will be sent to the client and no further handlers will be run.
         * - If a handler returns null, the next handler will be run.
         *
         * @see packages/payload/src/uploads/types.ts
         */
        break
      }
    } catch (err) {
      error = err
    }
  }

  if (!response) {
    if (error) {
      req.payload.logger.error(error)
    }

    throw new APIError('Expected response from the upload handler.')
  }

  if (response.status >= 300 && response.status < 400) {
    const redirectUrl = response.headers.get('Location')
    if (redirectUrl) {
      response = await fetch(redirectUrl)
    }
  }

  return response
}

/**
 * Overrides `req.headers` with a `Range` header while leaving the real incoming request
 * untouched. Uses a Proxy, rather than cloning `req`, because `req` is a native `Request`
 * instance at runtime - accessors like `.signal` are brand-checked against `req`'s internal
 * slots, so a plain clone (e.g. `Object.create(req)`) throws once a handler reads one of them.
 * Forwarding reads through `Reflect.get(req, prop, req)` keeps `this` bound to the real `req`
 * so those accessors keep working.
 */
const withRangeHeader = (req: PayloadRequest, rangeHeader: string): PayloadRequest => {
  const headers = new Headers(req.headers)
  headers.set('range', rangeHeader)

  return new Proxy(req, {
    get(target, prop) {
      return prop === 'headers' ? headers : Reflect.get(target, prop, target)
    },
  })
}

/**
 * Reads at most `maxBytes` from the response body, then cancels the reader - so a handler that
 * ignores the range hint and starts streaming the whole file is still cut short on our end.
 */
const readBoundedPrefix = async (response: Response, maxBytes: number): Promise<Buffer> => {
  if (!response.body) {
    return Buffer.alloc(0)
  }

  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let total = 0

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read()
      if (done || !value) {
        break
      }

      const remaining = maxBytes - total
      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value
      chunks.push(Buffer.from(chunk))
      total += chunk.byteLength
    }
  } finally {
    await reader.cancel().catch(() => {})
  }

  return Buffer.concat(chunks, total)
}

/**
 * Streams the fetched upload straight to disk instead of buffering it in memory. A client upload
 * (e.g. Azure's chunkLargeFiles) can be far larger than the server's available memory, so this
 * avoids re-downloading the whole file into a single in-memory buffer just to read it back out.
 */
const streamResponseToTempFile = async ({
  req,
  response,
}: {
  req: PayloadRequest
  response: Response
}): Promise<string> => {
  if (!response.body) {
    throw new APIError('Expected a response body from the upload handler.')
  }

  const tempFileDir = req.payload.config.upload?.tempFileDir || os.tmpdir()
  await mkdir(tempFileDir, { recursive: true })
  const tempFilePath = path.join(tempFileDir, `payload-client-upload-${randomUUID()}`)

  try {
    await pipeline(
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>),
      fs.createWriteStream(tempFilePath),
    )
  } catch (error) {
    await rm(tempFilePath, { force: true })
    throw error
  }

  return tempFilePath
}
