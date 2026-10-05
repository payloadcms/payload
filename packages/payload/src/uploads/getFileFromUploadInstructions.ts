import type { ReadableStream } from 'node:stream/web'

import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import type { PayloadRequest } from '../types/index.js'
import type { SanitizedUploadConfig, UploadEdits, UploadInstructions } from './types.js'

import { APIError } from '../errors/APIError.js'
import { sanitizeFilename } from '../utilities/sanitizeFilename.js'
import { sanitizeUploadPrefix } from '../utilities/sanitizeUploadPrefix.js'
import { verifyClientUploadReceipt } from './clientUploadReceipt.js'
import { docWithFilenameExists } from './docWithFilenameExists.js'
import { getOriginalFilename, normalizeStorageKey } from './fileVersioning/naming.js'
import { getFileContentRequirement, HEADER_PROBE_BYTE_LENGTH } from './getFileContentRequirement.js'
import { getImageSize } from './getImageSize.js'
import { hasCropOrResizeEdit } from './hasCropOrResizeEdit.js'
import { getStagedFile } from './stagedUpload.js'
import { planTransformerPipeline } from './transformers/planTransformerPipeline.js'
import { getUploadTransformerInternal } from './transformers/uploadTransformerBridge.js'

export const getFileFromUploadInstructions = async ({
  collectionSlug,
  file,
  req,
}: {
  collectionSlug: string
  file: UploadInstructions['file']
  req: PayloadRequest
}): Promise<NonNullable<PayloadRequest['file']>> => {
  if (req.context) {
    delete req.context._payloadVerifiedProviderOriginal
  }

  if (
    !file ||
    typeof file !== 'object' ||
    typeof file.filename !== 'string' ||
    typeof file.mimeType !== 'string' ||
    !Number.isSafeInteger(file.size) ||
    file.size < 0 ||
    !file.uploadReference ||
    typeof file.uploadReference !== 'object' ||
    Array.isArray(file.uploadReference)
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
  let allowOverwrite = false
  let providerFilename = file.filename
  let verifiedOriginal: { filename: string; key: string; signedReceipt: string } | undefined

  if (uploadConfig?.uploadInstructions?.requiresUploadReceipt) {
    const signedReceipt =
      'signedReceipt' in file.uploadReference ? file.uploadReference.signedReceipt : undefined
    const receipt = verifyClientUploadReceipt({
      collectionSlug,
      filename: file.filename,
      req,
      signedReceipt,
    })
    allowOverwrite = receipt.allowOverwrite === true
    let originalFilename: string
    let storageFilePath: string

    try {
      originalFilename = getOriginalFilename({ filename: file.filename })
      storageFilePath = normalizeStorageKey({ key: receipt.storageFilePath })
    } catch {
      throw new APIError('Invalid upload reference.', 400)
    }

    const expectedKeySuffix = [receipt.filePrefix, receipt._objectKey, originalFilename]
      .filter(Boolean)
      .join('/')

    if (
      (!allowOverwrite &&
        (!receipt._objectKey ||
          path.posix.basename(storageFilePath) !== originalFilename ||
          !`/${storageFilePath}`.endsWith(`/${expectedKeySuffix}`))) ||
      ('prefix' in file.uploadReference && file.uploadReference.prefix !== receipt.filePrefix) ||
      ('_objectKey' in file.uploadReference &&
        file.uploadReference._objectKey !== receipt._objectKey)
    ) {
      throw new APIError('Invalid upload reference.', 400)
    }

    providerFilename = allowOverwrite ? file.filename : originalFilename
    if (!allowOverwrite) {
      verifiedOriginal = {
        filename: originalFilename,
        key: storageFilePath,
        signedReceipt: signedReceipt as string,
      }
    }
    file = {
      ...file,
      uploadReference: {
        _objectKey: receipt._objectKey,
        prefix: receipt.filePrefix,
        signedReceipt,
      },
    }
  }

  const prefix =
    'prefix' in file.uploadReference && typeof file.uploadReference.prefix === 'string'
      ? file.uploadReference.prefix
      : undefined

  let sanitizedFilename: string

  try {
    sanitizedFilename = sanitizeFilename(file.filename)
  } catch {
    throw new APIError('Invalid upload reference.', 400)
  }

  if (
    sanitizedFilename !== file.filename ||
    (typeof prefix === 'string' && sanitizeUploadPrefix(prefix) !== prefix)
  ) {
    throw new APIError('Invalid upload reference.', 400)
  }

  // Provider-backed references are submitted with the document request. They may only claim a
  // new object identity; existing top-level and generated filenames already belong to another
  // document and must continue through that document's read access checks.
  if (
    !allowOverwrite &&
    (await docWithFilenameExists({
      collectionSlug,
      filename: file.filename,
      matchAnyPrefix: true,
      path: '',
      prefix,
      req,
    }))
  ) {
    throw new APIError('Invalid upload reference.', 400)
  }

  if (!uploadConfig || !uploadConfig.handlers) {
    throw new APIError('uploadConfig.handlers is not present for ' + collectionSlug)
  }

  const contentRequirement = getFileContentRequirement({
    hasSizeEdits: requestHasSizeEdits(req),
    hasTransformFileStages: await hasTransformFileStages({
      collectionSlug,
      mimeType: file.mimeType,
      req,
    }),
    mimeType: file.mimeType,
    uploadConfig,
  })
  const providerFile = { ...file, filename: providerFilename }
  const rememberVerifiedOriginal = () => {
    if (verifiedOriginal) {
      req.context ??= {}
      req.context._payloadVerifiedProviderOriginal = verifiedOriginal
    }
  }

  // Nothing downstream reads this file's content - use the client-reported metadata directly
  // instead of re-downloading a file that, for a chunked upload, can be far larger than
  // the server's available memory or disk.
  if (contentRequirement === 'none') {
    const response = await fetchUploadResponse({
      collectionSlug,
      file: providerFile,
      rangeHeader: file.size > 0 ? 'bytes=0-0' : undefined,
      req,
      uploadConfig,
    })
    assertProviderFileSize({ expectedSize: file.size, response })
    const prefix = await readBoundedPrefix(response, 1)
    if (file.size > 0 && prefix.length === 0) {
      throw new APIError('Uploaded source is not readable.', 400)
    }
    rememberVerifiedOriginal()

    return {
      name: file.filename,
      data: Buffer.alloc(0),
      mimetype: file.mimeType,
      size: file.size,
      uploadReference: file.uploadReference,
    }
  }

  if (contentRequirement === 'header') {
    const headerFile = await fetchHeaderOnly({
      collectionSlug,
      file: providerFile,
      req,
      uploadConfig,
    })
    if (headerFile) {
      rememberVerifiedOriginal()
      return { ...headerFile, name: file.filename }
    }
    // The header wasn't enough to determine the image's dimensions - fall through to a full fetch.
  }

  const response = await fetchUploadResponse({
    collectionSlug,
    file: providerFile,
    req,
    uploadConfig,
  })

  const tempFilePath = await streamResponseToTempFile({ req, response })
  if ((await stat(tempFilePath)).size !== file.size) {
    await rm(tempFilePath, { force: true })
    throw new APIError('Uploaded source size does not match the declared size.', 400)
  }
  req.context ??= {}
  req.context._payloadClientUploadTempFile = true
  rememberVerifiedOriginal()

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
 * Whether the request's `uploadEdits` query param carries a crop or resize edit - reads the raw
 * `req.query.uploadEdits`, since a full parse (with its `data`/`originalDoc` focal-point
 * fallback, done in generateFileData.ts) isn't available yet at this point in the request
 * lifecycle.
 */
const requestHasSizeEdits = (req: PayloadRequest): boolean => {
  const uploadEdits = req.query?.uploadEdits
  if (typeof uploadEdits !== 'object' || uploadEdits === null) {
    return false
  }

  return hasCropOrResizeEdit(uploadEdits as UploadEdits)
}

/**
 * Whether a transformer that reads the whole file will run `transformFile` on this upload. A
 * bridge transformer (e.g. `sharpTransformer`) is excluded: it projects what it needs onto the
 * sanitized upload config (`hasImageAdjustments`, `variants`) at startup instead.
 */
const hasTransformFileStages = async ({
  collectionSlug,
  mimeType,
  req,
}: {
  collectionSlug: string
  mimeType: string
  req: PayloadRequest
}): Promise<boolean> => {
  const transformers = req.payload.config.upload?.transformers ?? []

  if (transformers.length === 0) {
    return false
  }

  const pipeline = await planTransformerPipeline({
    args: { collectionSlug, mimeType, operation: 'upload', req },
    capability: 'transformFile',
    transformers,
  })

  return pipeline.some((transformer) => !getUploadTransformerInternal(transformer)?.prepareUpload)
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
  assertProviderFileSize({ expectedSize: file.size, response })

  const headerBuffer = await readBoundedPrefix(response, HEADER_PROBE_BYTE_LENGTH)

  try {
    await getImageSize({
      file: {
        name: file.filename,
        data: headerBuffer,
        mimetype: file.mimeType,
        size: file.size,
      },
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

const assertProviderFileSize = ({
  expectedSize,
  response,
}: {
  expectedSize: number
  response: Response
}): void => {
  const contentRange = response.headers.get('Content-Range')
  const reportedSize =
    response.status === 206
      ? contentRange?.match(/^bytes \d+-\d+\/(\d+)$/)?.[1]
      : response.headers.get('Content-Length')

  if (
    reportedSize === undefined ||
    reportedSize === null ||
    Number(reportedSize) !== expectedSize
  ) {
    throw new APIError('Uploaded source size does not match the declared size.', 400)
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
      response = await fetch(redirectUrl, {
        ...(rangeHeader && { headers: { Range: rangeHeader } }),
      })
    }
  }

  if (!response.ok) {
    throw new APIError('Uploaded source is not readable.', 400)
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
