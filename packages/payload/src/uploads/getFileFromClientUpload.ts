import { randomUUID } from 'crypto'
import fs from 'fs'
import { mkdir, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

import type { PayloadRequest } from '../types/index.js'
import type { SanitizedUploadConfig, UploadEdits } from './types.js'

import { APIError } from '../errors/APIError.js'
import { getFileContentRequirement, HEADER_PROBE_BYTE_LENGTH } from './getFileContentRequirement.js'
import { getImageSize } from './getImageSize.js'

export type ClientUploadData = {
  clientUploadContext?: unknown
  collectionSlug: string
  filename: string
  mimeType: string
  size: number
}

export async function getFileFromClientUpload({
  file,
  req,
}: {
  file: ClientUploadData
  req: PayloadRequest
}): Promise<NonNullable<PayloadRequest['file']>> {
  const uploadConfig = req.payload.collections[file.collectionSlug]?.config.upload

  if (!uploadConfig || !uploadConfig.handlers) {
    throw new APIError(`uploadConfig.handlers is not present for ${file.collectionSlug}`)
  }

  const contentRequirement = getFileContentRequirement({
    hasSizeEdits: requestHasSizeEdits(req),
    mimeType: file.mimeType,
    uploadConfig,
  })

  if (contentRequirement === 'none') {
    return {
      name: file.filename,
      clientUploadContext: file.clientUploadContext,
      data: Buffer.alloc(0),
      mimetype: file.mimeType,
      size: file.size,
    }
  }

  if (contentRequirement === 'header') {
    const headerFile = await fetchHeaderOnly({ file, req, uploadConfig })
    if (headerFile) {
      return headerFile
    }
  }

  const response = await fetchUploadResponse({ file, req, uploadConfig })
  const tempFilePath = await streamResponseToTempFile({ req, response })

  return {
    name: file.filename,
    clientUploadContext: file.clientUploadContext,
    data: Buffer.alloc(0),
    mimetype: response.headers.get('Content-Type') || file.mimeType,
    size: file.size,
    tempFilePath,
  }
}

/**
 * Only crop and explicit pixel edits require the original bytes - a focal-point-only
 * change re-derives from data already on the document, not the incoming upload.
 */
function requestHasSizeEdits(req: PayloadRequest): boolean {
  const uploadEdits =
    req.query?.uploadEdits && typeof req.query.uploadEdits === 'object'
      ? (req.query.uploadEdits as UploadEdits)
      : undefined

  return Boolean(uploadEdits?.crop || uploadEdits?.heightInPixels || uploadEdits?.widthInPixels)
}

/**
 * Runs every configured handler and returns the last one that responds, following a single
 * redirect if that response is one - matching the pre-existing v3 handler contract exactly
 * (v3 always ran every handler; only v4 stops at the first response, via an unrelated PR).
 */
async function fetchUploadResponse({
  file,
  req,
  uploadConfig,
}: {
  file: ClientUploadData
  req: PayloadRequest
  uploadConfig: SanitizedUploadConfig
}): Promise<Response> {
  let response: null | Response = null
  let error: unknown

  for (const handler of uploadConfig.handlers!) {
    try {
      const result = await handler(req, {
        doc: null!,
        params: {
          clientUploadContext: file.clientUploadContext,
          collection: file.collectionSlug,
          filename: file.filename,
        },
      })

      if (result) {
        response = result
      }
      // If we couldn't get the file from that handler, save the error and try other.
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
 * Requests a bounded byte range from the handlers and probes it for image dimensions, without
 * ever reading past `HEADER_PROBE_BYTE_LENGTH`. Returns `null` when the bounded bytes cannot be
 * probed, so the caller falls back to a full streamed fetch.
 */
async function fetchHeaderOnly({
  file,
  req,
  uploadConfig,
}: {
  file: ClientUploadData
  req: PayloadRequest
  uploadConfig: SanitizedUploadConfig
}): Promise<NonNullable<PayloadRequest['file']> | null> {
  const rangedHeaders = new Headers(req.headers)
  rangedHeaders.set('Range', `bytes=0-${HEADER_PROBE_BYTE_LENGTH - 1}`)

  const scopedReq = new Proxy(req, {
    get(target, prop) {
      if (prop === 'headers') {
        return rangedHeaders
      }
      return Reflect.get(target, prop, target)
    },
  })

  const response = await fetchUploadResponse({ file, req: scopedReq, uploadConfig })

  if (!response.body) {
    return null
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let bytesRead = 0

  try {
    while (bytesRead < HEADER_PROBE_BYTE_LENGTH) {
      const { done, value } = await reader.read()
      if (done || !value) {
        break
      }

      const remaining = HEADER_PROBE_BYTE_LENGTH - bytesRead
      const chunk = value.length > remaining ? value.slice(0, remaining) : value

      chunks.push(chunk)
      bytesRead += chunk.length
    }
  } finally {
    await reader.cancel().catch(() => undefined)
  }

  const probedFile = {
    name: file.filename,
    clientUploadContext: file.clientUploadContext,
    data: Buffer.concat(chunks),
    mimetype: response.headers.get('Content-Type') || file.mimeType,
    size: file.size,
  }

  try {
    await getImageSize({ file: probedFile, sharp: req.payload.config.sharp })
  } catch {
    return null
  }

  return probedFile
}

/**
 * Streams the full response body straight to disk so a cloud object of unbounded size never
 * becomes a single in-memory Buffer.
 */
async function streamResponseToTempFile({
  req,
  response,
}: {
  req: PayloadRequest
  response: Response
}): Promise<string> {
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
