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

  it('builds image sizes one at a time, so only one decoded copy is held in memory', async () => {
    let activePipelines = 0
    let maxActivePipelines = 0

    const createChain = (): any => {
      const chain: any = {
        clone: vi.fn(() => createChain()),
        metadata: vi.fn().mockResolvedValue({ height: 100, orientation: 1, width: 100 }),
        resize: vi.fn(() => chain),
        rotate: vi.fn(() => chain),
        toBuffer: vi.fn(async () => {
          activePipelines += 1
          maxActivePipelines = Math.max(maxActivePipelines, activePipelines)
          await new Promise((resolve) => setTimeout(resolve, 10))
          activePipelines -= 1

          return {
            data: Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'),
            info: { channels: 4, format: 'png', height: 50, size: 100, width: 50 },
          }
        }),
      }

      return chain
    }

    const sharp = vi.fn(() => createChain())

    const multiSizeConfig = {
      upload: {
        imageSizes: [
          { name: 'small', height: 50, width: 50 },
          { name: 'medium', height: 40, width: 40 },
          { name: 'large', height: 30, width: 30 },
        ],
      },
    } as unknown as SanitizedCollectionConfig

    const result = await createImageSizes({
      config: multiSizeConfig,
      dimensions: { height: 100, width: 100 },
      file: createFile('image/png'),
      mimeType: 'image/png',
      req: { payloadUploadSizes: {} } as PayloadRequest,
      savedFilename: 'photo.png',
      sharp: sharp as any,
      staticPath: '/tmp',
    })

    expect(Object.keys(result.sizeData).sort()).toEqual(['large', 'medium', 'small'])
    expect(result.sizesToSave).toHaveLength(3)
    expect(maxActivePipelines).toBe(1)
  })
})
