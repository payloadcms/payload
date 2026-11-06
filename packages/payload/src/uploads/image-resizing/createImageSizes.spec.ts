import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { createImageSizes } from './createImageSizes.js'

describe('createImageSizes', () => {
  let staticPath: string

  beforeEach(async () => {
    staticPath = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-image-sizes-'))
  })

  afterEach(async () => {
    await fs.rm(staticPath, { force: true, recursive: true })
  })

  // Stored as 3000x2000 with EXIF orientation 6, so it displays as a 2000x3000 portrait.
  const resizeRotatedImage = async (focalPoint?: { x: number; y: number }) => {
    const data = await sharp({
      create: { background: '#888', channels: 3, height: 2000, width: 3000 },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()

    const { sizeData } = await createImageSizes({
      config: {
        upload: { imageSizes: [{ name: 'full', width: 2400, withoutEnlargement: true }] },
      } as unknown as SanitizedCollectionConfig,
      dimensions: { height: 2000, width: 3000 },
      file: { data, mimetype: 'image/jpeg', name: 'photo.jpg', size: data.length },
      focalPoint,
      mimeType: 'image/jpeg',
      req: { payload: { logger: console } } as unknown as PayloadRequest,
      savedFilename: 'photo.jpg',
      sharp,
      staticPath,
      withMetadata: false,
    })

    return sizeData.full
  }

  it.each([
    { focalPoint: undefined, label: 'without a focal point' },
    { focalPoint: { x: 50, y: 50 }, label: 'with a focal point' },
  ])(
    'should not enlarge an EXIF-rotated image past its displayed size $label',
    async ({ focalPoint }) => {
      const full = await resizeRotatedImage(focalPoint)

      expect({ height: full?.height, width: full?.width }).toEqual({ height: 3000, width: 2000 })
    },
  )
})
