import { describe, expect, it, vi } from 'vitest'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { getRequestedFile, resolveUploadDocument } from './resolveUploadDocument.js'

describe('resolveUploadDocument', () => {
  it('should reject path traversal in the filename without querying the database', async () => {
    const findOne = vi.fn()
    const req = { payload: { db: { findOne } }, t: vi.fn() } as unknown as PayloadRequest
    const collection = { config: { slug: 'test-media', upload: {} } } as unknown as Collection

    await expect(
      resolveUploadDocument({ collection, filename: '../etc/passwd', req }),
    ).rejects.toThrow()
    expect(findOne).not.toHaveBeenCalled()
  })
})

describe('getRequestedFile', () => {
  const document = {
    id: '1',
    filename: 'logo.png',
    mimeType: 'image/png',
    variants: {
      card: { filename: 'logo-640x480.webp', mimeType: 'image/webp' },
      skipped: { filename: null, mimeType: null },
    },
  }

  it.each([
    ['the primary filename', 'logo.png', { filename: 'logo.png', mimeType: 'image/png' }],
    [
      'an image size filename',
      'logo-640x480.webp',
      { filename: 'logo-640x480.webp', mimeType: 'image/webp' },
    ],
    ['an unmatched filename', 'unknown.png', { filename: 'logo.png', mimeType: 'image/png' }],
  ])('should resolve the requested file for %s', (_, filename, expected) => {
    expect(getRequestedFile({ document, filename })).toMatchObject(expected)
  })

  const documentWithOriginal = {
    _stored: false,
    id: '1',
    filename: 'logo.webp',
    mimeType: 'image/webp',
    original: { filename: 'logo-original.png', mimeType: 'image/png' },
    variants: {
      card: { _stored: false, filename: 'logo-card.webp', mimeType: null },
    },
  }

  it.each([
    [
      'the original filename',
      documentWithOriginal,
      'logo-original.png',
      { filename: 'logo-original.png', isBuiltAtRequest: false, mimeType: 'image/png' },
    ],
    [
      'an original filename when the original has no MIME type',
      { ...documentWithOriginal, original: { filename: 'logo-original.png', mimeType: null } },
      'logo-original.png',
      { filename: 'logo.webp', isBuiltAtRequest: true, mimeType: 'image/webp' },
    ],
    [
      'a size built at request time with no MIME type',
      documentWithOriginal,
      'logo-card.webp',
      {
        filename: 'logo-card.webp',
        isBuiltAtRequest: true,
        mimeType: 'image/png',
        variantName: 'card',
      },
    ],
    [
      'a main file built at request time',
      documentWithOriginal,
      'logo.webp',
      { filename: 'logo.webp', isBuiltAtRequest: true, mimeType: 'image/webp' },
    ],
  ])('should resolve the requested file for %s', (_, doc, filename, expected) => {
    expect(getRequestedFile({ document: doc, filename })).toEqual(expected)
  })
})
