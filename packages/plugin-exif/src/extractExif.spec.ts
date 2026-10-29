import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { extractExif } from './extractExif.js'

const jpegWithExif = async (): Promise<Buffer> =>
  sharp({
    create: {
      background: { b: 0, g: 0, r: 255 },
      channels: 3,
      height: 8,
      width: 8,
    },
  })
    // sharp 0.32.6 has no `withExif` (that arrived in 0.33+); use `withMetadata({ exif })`.
    .withMetadata({ exif: { IFD0: { Make: 'TestCam', Model: 'X100' } } })
    .jpeg()
    .toBuffer()

const jpegWithoutExif = async (): Promise<Buffer> =>
  sharp({
    create: {
      background: { b: 0, g: 0, r: 0 },
      channels: 3,
      height: 8,
      width: 8,
    },
  })
    .jpeg()
    .toBuffer()

describe('extractExif', () => {
  it('should extract make and model from a real jpeg buffer', async () => {
    const buffer = await jpegWithExif()
    const result = await extractExif({ buffer })

    expect(result?.raw).toMatchObject({ Make: 'TestCam', Model: 'X100' })
  })

  it('should resolve to null-ish when the image has no exif', async () => {
    const buffer = await jpegWithoutExif()
    const result = await extractExif({ buffer })

    expect(result?.raw ?? null).toBeNull()
  })

  it('should return null for a non-image buffer without throwing', async () => {
    const result = await extractExif({ buffer: Buffer.from('not an image') })

    expect(result).toBeNull()
  })
})
