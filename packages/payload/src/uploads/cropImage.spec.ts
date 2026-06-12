import fs from 'fs/promises'
import path from 'path'
import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { cropImage } from './cropImage.js'

describe('cropImage', () => {
  it('should crop EXIF-oriented images using rotated dimensions', async () => {
    // @ts-expect-error sharp default export depends on tsconfig interop settings
    const sharp = (await import('sharp')).default as typeof import('sharp')

    const baseImageSVG = Buffer.from(
      '<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="800" fill="#00ffff"/></svg>',
    )

    const exifOrientedJpeg = await sharp(baseImageSVG)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()

    const result = await cropImage({
      cropData: {
        height: 100,
        unit: '%',
        width: 100,
        x: 0,
        y: 0,
      },
      dimensions: {
        height: 1200,
        width: 800,
      },
      file: {
        data: exifOrientedJpeg,
        mimetype: 'image/jpeg',
        name: 'oriented.jpg',
        size: exifOrientedJpeg.length,
      },
      heightInPixels: 1199,
      req: {} as PayloadRequest,
      sharp,
      widthInPixels: 799,
      withMetadata: false,
    })

    expect(result.info.width).toEqual(799)
    expect(result.info.height).toEqual(1199)
  })
})
