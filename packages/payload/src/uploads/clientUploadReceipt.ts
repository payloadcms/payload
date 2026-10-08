import crypto from 'crypto'

import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/APIError.js'

export type ClientUploadReceipt = {
  collectionSlug: string
  context: Record<string, unknown>
  expiresAt: number
  filename: string
  userCollection: null | string
  userID: null | number | string
}

// `<base64url payload>.<base64url HMAC signature>`
export type SignedClientUploadReceipt = `${string}.${string}`

const LIFETIME_MS = 6 * 60 * 60 * 1000
const DOMAIN = 'payload-client-upload-receipt-v1'

export const createClientUploadReceipt = ({
  collectionSlug,
  context,
  filename,
  req,
  user = getUser(req),
}: {
  collectionSlug: string
  context: Record<string, unknown>
  filename: string
  req: PayloadRequest
  user?: Pick<ClientUploadReceipt, 'userCollection' | 'userID'>
}): SignedClientUploadReceipt => {
  const data: ClientUploadReceipt = {
    collectionSlug,
    context,
    expiresAt: Date.now() + LIFETIME_MS,
    filename,
    ...user,
  }
  const encodedReceipt = Buffer.from(JSON.stringify(data)).toString('base64url')

  return `${encodedReceipt}.${sign(encodedReceipt, req.payload.secret)}`
}

export const verifyClientUploadReceipt = ({
  collectionSlug,
  req,
  signedReceipt,
}: {
  collectionSlug: string
  req: PayloadRequest
  signedReceipt: string
}): ClientUploadReceipt => {
  const [encodedReceipt, signature, extra] = signedReceipt.split('.')
  const expected = encodedReceipt ? sign(encodedReceipt, req.payload.secret) : ''

  if (!encodedReceipt || !signature || extra || !equal(signature, expected)) {
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
    decodedReceipt.collectionSlug !== collectionSlug ||
    decodedReceipt.expiresAt <= Date.now() ||
    decodedReceipt.userCollection !== user.userCollection ||
    decodedReceipt.userID !== user.userID
  ) {
    throwInvalidReference()
  }

  return decodedReceipt
}

function throwInvalidReference(): never {
  throw new APIError('Invalid or expired client upload reference.', 400)
}

const getUser = (req: PayloadRequest) => ({
  userCollection: req.user?.collection ?? null,
  userID: req.user?.id ?? null,
})

const sign = (encodedReceipt: string, secret: string) =>
  crypto.createHmac('sha256', `${DOMAIN}:${secret}`).update(encodedReceipt).digest('base64url')

const equal = (actual: string, expected: string) => {
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
    typeof data.collectionSlug === 'string' &&
    Boolean(data.context) &&
    typeof data.context === 'object' &&
    !Array.isArray(data.context) &&
    typeof data.expiresAt === 'number' &&
    Number.isFinite(data.expiresAt) &&
    typeof data.filename === 'string' &&
    (data.userCollection === null || typeof data.userCollection === 'string') &&
    (data.userID === null ||
      typeof data.userID === 'string' ||
      (typeof data.userID === 'number' && Number.isFinite(data.userID)))
  )
}
