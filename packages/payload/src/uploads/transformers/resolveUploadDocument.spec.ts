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
    sizes: {
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
    expect(getRequestedFile({ document, filename })).toEqual(expected)
  })
})
