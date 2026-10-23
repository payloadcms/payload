import type { PayloadRequest } from '../types/index.js'

import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { createClientUploadReceipt, verifyClientUploadReceipt } from './clientUploadReceipt.js'

const secret = 'test-secret'

const req = {
  payload: { secret },
  user: { id: 'user-1', collection: 'users' },
} as unknown as PayloadRequest

const receiptArgs = {
  _objectKey: 'upload-1',
  collectionSlug: 'media',
  filename: 'photo.jpg',
  filePrefix: 'media',
  req,
  storageFilePath: 'media/upload-1/photo-original.jpg',
}

// Signs data the same way createClientUploadReceipt does, so a test can sign data it would refuse to build.
const signReceipt = (data: Record<string, unknown>): string => {
  const encodedReceipt = Buffer.from(JSON.stringify(data)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', `payload-client-upload-receipt-v1:${secret}`)
    .update(encodedReceipt)
    .digest('base64url')

  return `${encodedReceipt}.${signature}`
}

describe('clientUploadReceipt', () => {
  it('should return signed adapterData from a verified receipt', () => {
    const signedReceipt = createClientUploadReceipt({
      ...receiptArgs,
      adapterData: { providerUploadID: 'provider-1' },
    })

    const receipt = verifyClientUploadReceipt({ req, signedReceipt })

    expect(receipt.adapterData).toEqual({ providerUploadID: 'provider-1' })
  })

  it('should reject a receipt whose adapterData is not a plain object', () => {
    const signedReceipt = signReceipt({
      _objectKey: 'upload-1',
      adapterData: ['provider-1'],
      collectionSlug: 'media',
      expiresAt: Date.now() + 60_000,
      filename: 'photo.jpg',
      filePrefix: 'media',
      storageFilePath: 'media/upload-1/photo-original.jpg',
      userCollection: 'users',
      userID: 'user-1',
    })

    expect(() => verifyClientUploadReceipt({ req, signedReceipt })).toThrow(
      'Invalid upload reference.',
    )
  })
})
