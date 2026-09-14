import crypto from 'node:crypto'

import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/APIError.js'

type ClientUploadReceipt = {
  _objectKey?: string
  allowOverwrite?: boolean
  collectionSlug: string
  expiresAt: number
  fileKey: string
  filename: string
  filePrefix: string
  userCollection: null | string
  userID: null | number | string
}

// Longer than the longest provider upload URL (GCS: five hours).
const LIFETIME_MS = 6 * 60 * 60 * 1000
// Separates these signatures from any future receipt format.
const DOMAIN = 'payload-client-upload-receipt-v1'

export const createClientUploadReceipt = ({
  _objectKey,
  allowOverwrite,
  collectionSlug,
  fileKey,
  filename,
  filePrefix,
  req,
}: {
  _objectKey?: string
  allowOverwrite?: boolean
  collectionSlug: string
  fileKey: string
  filename: string
  filePrefix: string
  req: PayloadRequest
}): `${string}.${string}` => {
  const data: ClientUploadReceipt = {
    ...(_objectKey !== undefined && { _objectKey }),
    ...(allowOverwrite && { allowOverwrite: true }),
    collectionSlug,
    expiresAt: Date.now() + LIFETIME_MS,
    fileKey,
    filename,
    filePrefix,
    ...getUser(req),
  }
  const encodedReceipt = Buffer.from(JSON.stringify(data)).toString('base64url')

  return `${encodedReceipt}.${sign({ encodedReceipt, secret: req.payload.secret })}`
}

export const verifyClientUploadReceipt = ({
  collectionSlug,
  filename,
  req,
  signedReceipt,
}: {
  collectionSlug?: string
  filename?: string
  req: PayloadRequest
  signedReceipt: unknown
}): ClientUploadReceipt => {
  if (typeof signedReceipt !== 'string') {
    throwInvalidReference()
  }
  const [encodedReceipt, signature, extra] = signedReceipt.split('.')
  const expected = encodedReceipt ? sign({ encodedReceipt, secret: req.payload.secret }) : ''

  if (!encodedReceipt || !signature || extra || !equal({ actual: signature, expected })) {
    throwInvalidReference()
  }

  let decodedReceipt: unknown
  try {
    decodedReceipt = JSON.parse(Buffer.from(encodedReceipt, 'base64url').toString())
  } catch {
    throwInvalidReference()
  }

  const user = getUser(req)
  if (
    !isReceipt(decodedReceipt) ||
    decodedReceipt.expiresAt <= Date.now() ||
    decodedReceipt.userCollection !== user.userCollection ||
    decodedReceipt.userID !== user.userID ||
    (collectionSlug !== undefined && decodedReceipt.collectionSlug !== collectionSlug) ||
    (filename !== undefined && decodedReceipt.filename !== filename)
  ) {
    throwInvalidReference()
  }

  return decodedReceipt
}

function throwInvalidReference(): never {
  throw new APIError('Invalid upload reference.', 400)
}

const getUser = (req: PayloadRequest) => ({
  userCollection: req.user?.collection ?? null,
  userID: req.user?.id ?? null,
})

const sign = ({ encodedReceipt, secret }: { encodedReceipt: string; secret: string }) =>
  crypto.createHmac('sha256', `${DOMAIN}:${secret}`).update(encodedReceipt).digest('base64url')

const equal = ({ actual, expected }: { actual: string; expected: string }) => {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

const isReceipt = (value: unknown): value is ClientUploadReceipt => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const data = value as Partial<ClientUploadReceipt>
  return (
    (data._objectKey === undefined || typeof data._objectKey === 'string') &&
    (data.allowOverwrite === undefined || typeof data.allowOverwrite === 'boolean') &&
    typeof data.collectionSlug === 'string' &&
    typeof data.expiresAt === 'number' &&
    Number.isFinite(data.expiresAt) &&
    typeof data.fileKey === 'string' &&
    typeof data.filePrefix === 'string' &&
    typeof data.filename === 'string' &&
    (data.userCollection === null || typeof data.userCollection === 'string') &&
    (data.userID === null ||
      typeof data.userID === 'string' ||
      (typeof data.userID === 'number' && Number.isFinite(data.userID)))
  )
}
