import type { PayloadRequest } from '../types/index.js'

import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createClientUploadReceipt,
  resignClientUploadReceipt,
  verifyClientUploadReceipt,
} from './clientUploadReceipt.js'

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

  describe('resignClientUploadReceipt', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('should add adapterData and keep the other receipt fields', () => {
      const signedReceipt = createClientUploadReceipt({
        ...receiptArgs,
        adapterData: { providerUploadID: 'provider-1' },
      })
      const original = verifyClientUploadReceipt({ req, signedReceipt })

      const resigned = resignClientUploadReceipt({
        adapterData: { providerObjectID: 'object-1' },
        req,
        signedReceipt,
      })

      expect(verifyClientUploadReceipt({ req, signedReceipt: resigned })).toEqual({
        ...original,
        adapterData: { providerObjectID: 'object-1', providerUploadID: 'provider-1' },
      })
    })

    it('should reject a receipt issued to another user', () => {
      const otherUserReq = {
        ...req,
        user: { id: 'user-2', collection: 'users' },
      } as unknown as PayloadRequest
      const signedReceipt = createClientUploadReceipt({ ...receiptArgs, req: otherUserReq })

      expect(() =>
        resignClientUploadReceipt({
          adapterData: { providerObjectID: 'object-1' },
          req,
          signedReceipt,
        }),
      ).toThrow('Invalid upload reference.')
    })

    it('should reject a receipt for another collection when collectionSlug is passed', () => {
      const signedReceipt = createClientUploadReceipt(receiptArgs)

      expect(() =>
        resignClientUploadReceipt({
          adapterData: { providerObjectID: 'object-1' },
          collectionSlug: 'documents',
          req,
          signedReceipt,
        }),
      ).toThrow('Invalid upload reference.')
    })

    it('should keep the original expiry', () => {
      vi.useFakeTimers()
      const signedReceipt = createClientUploadReceipt(receiptArgs)
      const { expiresAt } = verifyClientUploadReceipt({ req, signedReceipt })
      vi.advanceTimersByTime(60_000)

      const resigned = resignClientUploadReceipt({
        adapterData: { providerObjectID: 'object-1' },
        req,
        signedReceipt,
      })

      expect(verifyClientUploadReceipt({ req, signedReceipt: resigned }).expiresAt).toBe(expiresAt)
    })
  })
})
