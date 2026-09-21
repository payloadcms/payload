import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { cropImage } from './cropImage.js'

const createSharpMock = () => {
  const chain: any = {
    extract: vi.fn(() => chain),
    metadata: vi.fn().mockResolvedValue({ height: 100, pages: 1 }),
    toBuffer: vi.fn().mockResolvedValue({
      data: Buffer.from('cropped'),
      info: { height: 50, size: 7, width: 50 },
    }),
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

describe('cropImage', () => {
  it('enables sharp animated reading for tiff, matching isAnimatedImage', async () => {
    const sharp = createSharpMock()
    const file = createFile('image/tiff')

    await cropImage({
      cropData: { x: 10, y: 10 },
      dimensions: { height: 100, width: 100 },
      file,
      heightInPixels: 50,
      sharp: sharp as any,
      widthInPixels: 50,
    })

    expect(sharp).toHaveBeenCalledWith(file!.data, { animated: true })
  })

  it('does not enable sharp animated reading for avif, matching isAnimatedImage', async () => {
    const sharp = createSharpMock()
    const file = createFile('image/avif')

    await cropImage({
      cropData: { x: 10, y: 10 },
      dimensions: { height: 100, width: 100 },
      file,
      heightInPixels: 50,
      sharp: sharp as any,
      widthInPixels: 50,
    })

    expect(sharp).toHaveBeenCalledWith(file!.data, {})
  })
})
