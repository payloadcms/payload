import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { createImageSizes } from './createImageSizes.js'

const createSharpMock = () => {
  const chain: any = {
    metadata: vi.fn().mockResolvedValue({ height: 10, orientation: 1, width: 10 }),
    rotate: vi.fn(() => chain),
  }

  const sharp = vi.fn(() => chain)

  return sharp
}

const createFile = (mimetype: string): PayloadRequest['file'] =>
  ({
    data: Buffer.from('original'),
    mimetype,
    name: 'photo',
    size: 8,
  }) as PayloadRequest['file']

// Larger than the source image, with `withoutEnlargement` left undefined, so
// `getImageResizeAction` returns `'omit'` before any resize/extract sharp calls run - the initial
// `sharp(...)` call used to probe the source image's own metadata is all that's under test here.
const config = {
  upload: {
    imageSizes: [{ name: 'thumb', height: 100, width: 100 }],
  },
} as unknown as SanitizedCollectionConfig

describe('createImageSizes', () => {
  it('enables sharp animated reading for tiff, matching isAnimatedImage', async () => {
    const sharp = createSharpMock()
    const file = createFile('image/tiff')

    await createImageSizes({
      config,
      dimensions: { height: 10, width: 10 },
      file,
      mimeType: 'image/tiff',
      req: { payloadUploadSizes: {} } as PayloadRequest,
      savedFilename: 'photo.tiff',
      sharp: sharp as any,
      staticPath: '/tmp',
    })

    expect(sharp).toHaveBeenCalledWith(file!.data, { animated: true })
  })

  it('does not enable sharp animated reading for avif, matching isAnimatedImage', async () => {
    const sharp = createSharpMock()
    const file = createFile('image/avif')

    await createImageSizes({
      config,
      dimensions: { height: 10, width: 10 },
      file,
      mimeType: 'image/avif',
      req: { payloadUploadSizes: {} } as PayloadRequest,
      savedFilename: 'photo.avif',
      sharp: sharp as any,
      staticPath: '/tmp',
    })

    expect(sharp).toHaveBeenCalledWith(file!.data, {})
  })
})
