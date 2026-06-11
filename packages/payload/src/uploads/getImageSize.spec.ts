import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { getImageSize } from './getImageSize.js'

// Minimal 1x1 PNG used to assert real images still probe correctly.
const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
  'base64',
)

const makeFile = (overrides: Partial<NonNullable<PayloadRequest['file']>>) =>
  ({
    name: 'test.png',
    data: Buffer.alloc(0),
    mimetype: 'image/png',
    size: 0,
    ...overrides,
  }) as NonNullable<PayloadRequest['file']>

describe('getImageSize', () => {
  it('should return undefined dimensions for an empty buffer instead of throwing', async () => {
    const result = await getImageSize(makeFile({ data: Buffer.alloc(0) }))

    expect(result).toBeUndefined()
  })

  it('should return undefined dimensions for a corrupt (non-empty) buffer instead of throwing', async () => {
    const result = await getImageSize(makeFile({ data: Buffer.from('not an image') }))

    expect(result).toBeUndefined()
  })

  it('should probe dimensions for a valid image buffer', async () => {
    const result = await getImageSize(makeFile({ data: onePixelPng, size: onePixelPng.length }))

    expect(result).toMatchObject({ height: 1, width: 1 })
  })
})
