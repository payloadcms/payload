import type { PayloadRequest } from 'payload'

import { createClientUploadReceipt } from 'payload/internal'
import { describe, expect, it } from 'vitest'

import { verifyClientUploadReceiptForFileKey } from './verifyClientUploadReceiptForFileKey.js'

const req = { payload: { secret: 'test-secret' } } as unknown as PayloadRequest

const issueReceipt = ({
  collectionSlug = 'media',
  filename = 'photo.png',
  prefix,
}: {
  collectionSlug?: string
  filename?: string
  prefix: unknown
}) =>
  createClientUploadReceipt({
    collectionSlug,
    context: { prefix },
    filename,
    req,
  })

const verify = ({
  expectedFileKey,
  signedReceipt,
  useCompositePrefixes,
}: {
  expectedFileKey: string
  signedReceipt: string
  useCompositePrefixes?: boolean
}) =>
  verifyClientUploadReceiptForFileKey({
    collectionPrefix: 'media',
    collectionSlug: 'media',
    expectedFileKey,
    req,
    signedReceipt,
    useCompositePrefixes,
  })

/**
 * This guard is what lets adapters accept a caller-supplied storage key: the key is
 * recomputed from the signed prefix and filename, so a receipt issued for one location
 * cannot be replayed against another.
 */
describe('verifyClientUploadReceiptForFileKey', () => {
  it('should accept the key the receipt was issued for', () => {
    const signedReceipt = issueReceipt({ prefix: 'media/documents' })

    expect(verify({ expectedFileKey: 'media/documents/photo.png', signedReceipt }).filename).toBe(
      'photo.png',
    )
  })

  it.each([
    ['a sibling of the collection prefix', 'media-archive/photo.png'],
    ['another collection', 'invoices/photo.png'],
    ['another document prefix in the same collection', 'media/other-doc/photo.png'],
    ['another filename under the issued prefix', 'media/documents/payroll.pdf'],
  ])('should reject %s', (_case, expectedFileKey) => {
    const signedReceipt = issueReceipt({ prefix: 'media/documents' })

    expect(() => verify({ expectedFileKey, signedReceipt })).toThrow(
      'Client upload reference does not match this request.',
    )
  })

  it('should reject a receipt issued for another collection', () => {
    const signedReceipt = issueReceipt({ collectionSlug: 'invoices', prefix: 'media/documents' })

    expect(() => verify({ expectedFileKey: 'media/documents/photo.png', signedReceipt })).toThrow(
      'Invalid or expired client upload reference.',
    )
  })

  it('should reject a receipt whose prefix is not a string', () => {
    const signedReceipt = issueReceipt({ prefix: { nested: true } })

    expect(() => verify({ expectedFileKey: 'media/photo.png', signedReceipt })).toThrow(
      'Client upload reference does not match this request.',
    )
  })

  it('should reject a tampered signature', () => {
    const signedReceipt = issueReceipt({ prefix: 'media/documents' })
    const [encodedReceipt] = signedReceipt.split('.')

    expect(() =>
      verify({
        expectedFileKey: 'media/documents/photo.png',
        signedReceipt: `${encodedReceipt}.not-the-signature`,
      }),
    ).toThrow()
  })

  it('should recompute the key in composite mode', () => {
    const signedReceipt = issueReceipt({ prefix: 'documents' })

    expect(
      verify({
        expectedFileKey: 'media/documents/photo.png',
        signedReceipt,
        useCompositePrefixes: true,
      }).filename,
    ).toBe('photo.png')
  })
})
