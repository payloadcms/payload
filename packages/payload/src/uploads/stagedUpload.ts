import { jwtVerify } from 'jose'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import type { PayloadHandler } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { File, UploadInstructions, UploadInstructionsRequest } from './types.js'

import { jwtSign } from '../auth/jwt.js'
import { APIError, Forbidden } from '../errors/index.js'
import { formatAdminURL } from '../utilities/formatAdminURL.js'

/**
 * Creates a signed, one-hour URL where the client can send the file bytes. The returned file value
 * is later passed to a document create or update request.
 */
export const generateStagedUploadInstructions = async ({
  collectionSlug,
  docPrefix,
  filename,
  filesize,
  mimeType,
  req,
}: { req: PayloadRequest } & UploadInstructionsRequest): Promise<UploadInstructions> => {
  await removeExpiredUploads(req, collectionSlug)

  const { token: uploadId } = await jwtSign({
    fieldsToSign: {
      id: randomUUID(),
      collectionSlug,
      docPrefix,
      filename,
      filesize,
      mimeType,
      user: getUser(req),
    },
    secret: req.payload.secret,
    tokenExpiration,
  })

  return {
    type: 'http',
    file: {
      filename,
      mimeType,
      size: filesize,
      uploadReference: { uploadId },
    },
    request: {
      headers: {
        'Content-Length': String(filesize),
        'Content-Type': mimeType,
      },
      method: 'PUT',
      url: formatAdminURL({
        apiRoute: req.payload.config.routes.api,
        path: `/upload-instructions/${uploadId}`,
        serverURL: req.payload.config.serverURL,
      }),
    },
  }
}

/**
 * Saves the bytes sent to a signed upload URL. The file is written as a partial file first and only
 * becomes available when its size exactly matches the size in the upload ID.
 */
export const uploadStagedFile: PayloadHandler = async (req) => {
  const upload = await verifyUploadID(req, req.routeParams?.uploadId)
  const directory = await getUploadDirectory(req, upload.collectionSlug)
  const uploadPath = path.join(directory, upload.id)
  const temporaryPath = `${uploadPath}.${randomUUID()}.part`
  const file = await fs.open(temporaryPath, 'wx')
  let uploadedSize = 0

  try {
    try {
      const reader = req.body?.getReader()

      while (reader) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        uploadedSize += value.byteLength
        if (uploadedSize > upload.filesize) {
          throw new APIError('Uploaded file is larger than expected.', 400)
        }

        let offset = 0
        while (offset < value.byteLength) {
          const { bytesWritten } = await file.write(value, offset)
          offset += bytesWritten
        }
      }

      if (uploadedSize !== upload.filesize) {
        throw new APIError('Uploaded file size does not match the expected size.', 400)
      }
    } finally {
      await file.close()
    }
  } catch (error) {
    await fs.rm(temporaryPath, { force: true })
    throw error
  }

  await fs.rename(temporaryPath, uploadPath)

  return new Response(null, { status: 204 })
}

/** Removes a temporary upload that the client no longer needs. */
export const deleteStagedFile: PayloadHandler = async (req) => {
  const upload = await verifyUploadID(req, req.routeParams?.uploadId)
  const directory = await getUploadDirectory(req, upload.collectionSlug)

  await fs.rm(path.join(directory, upload.id), { force: true })

  return new Response(null, { status: 204 })
}

/**
 * Loads a completed staged file for a document request. Only the same user and collection can use
 * it, and the temporary file is deleted after it is read.
 */
export const getStagedFile = async ({
  collectionSlug,
  req,
  uploadReference,
}: {
  collectionSlug: string
  req: PayloadRequest
  uploadReference: unknown
}): Promise<File> => {
  if (
    !uploadReference ||
    typeof uploadReference !== 'object' ||
    Array.isArray(uploadReference) ||
    !('uploadId' in uploadReference) ||
    typeof uploadReference.uploadId !== 'string'
  ) {
    throw new APIError('Invalid staged upload.', 400)
  }

  const { uploadId } = uploadReference
  const upload = await verifyUploadID(req, uploadId)

  if (upload.collectionSlug !== collectionSlug || upload.user !== getUser(req)) {
    throw new Forbidden(req.t)
  }

  const directory = await getUploadDirectory(req, upload.collectionSlug)
  const tempFilePath = path.join(directory, upload.id)
  let data: Buffer

  try {
    data = await fs.readFile(tempFilePath)
  } catch {
    throw new APIError('Staged upload was not found.', 400)
  }

  if (data.length !== upload.filesize) {
    await fs.rm(tempFilePath, { force: true })
    throw new APIError('Staged upload is incomplete.', 400)
  }

  await fs.rm(tempFilePath, { force: true })

  return {
    name: upload.filename,
    data,
    mimetype: upload.mimeType,
    size: data.length,
  }
}

/**
 * Staged uploads hold a file temporarily until a document create or update uses it. The signed
 * upload ID remembers which file and user the upload belongs to.
 */
const tokenExpiration = 60 * 60

/** The file details stored inside the signed upload ID. */
type StagedUploadToken = {
  id: string
  user: null | string
} & UploadInstructionsRequest

const getUser = (req: PayloadRequest) =>
  req.user ? `${req.user.collection}:${String(req.user.id)}` : null

/** Returns the hidden folder where temporary uploads for this collection are stored. */
const getUploadDirectory = async (req: PayloadRequest, collectionSlug: string) => {
  const upload = req.payload.collections[collectionSlug]?.config.upload
  const directory = path.resolve(
    upload && !upload.disableLocalStorage
      ? upload.staticDir || collectionSlug
      : req.payload.config.upload.tempFileDir || os.tmpdir(),
    '.payload-staged-uploads',
  )

  await fs.mkdir(directory, { recursive: true })

  return directory
}

/** Removes temporary files older than the one-hour upload window. */
const removeExpiredUploads = async (req: PayloadRequest, collectionSlug: string) => {
  const directory = await getUploadDirectory(req, collectionSlug)
  const expiresBefore = Date.now() - tokenExpiration * 1000

  for (const filename of await fs.readdir(directory)) {
    const filePath = path.join(directory, filename)
    const stats = await fs.stat(filePath).catch(() => null)

    if (stats && stats.mtimeMs < expiresBefore) {
      await fs.rm(filePath, { force: true })
    }
  }
}

/** Verifies that an upload ID was signed by Payload, has not expired, and contains valid details. */
const verifyUploadID = async (
  req: PayloadRequest,
  uploadID: unknown,
): Promise<StagedUploadToken> => {
  try {
    if (typeof uploadID !== 'string') {
      throw new Error()
    }

    const secret = new TextEncoder().encode(req.payload.secret)
    const { payload } = await jwtVerify<StagedUploadToken>(uploadID, secret)

    if (
      typeof payload.id !== 'string' ||
      !/^[\da-f-]{36}$/i.test(payload.id) ||
      typeof payload.collectionSlug !== 'string' ||
      typeof payload.filename !== 'string' ||
      !Number.isSafeInteger(payload.filesize) ||
      payload.filesize < 0 ||
      typeof payload.mimeType !== 'string' ||
      (payload.user !== null && typeof payload.user !== 'string')
    ) {
      throw new Error()
    }

    return payload as StagedUploadToken
  } catch {
    throw new APIError('Invalid or expired staged upload.', 400)
  }
}
