import sharp from 'sharp'
import { expect, it, vi } from 'vitest'

import { createPrepareLegacyUpload } from './prepareLegacyUpload.js'

it('should derive stored sizes from the original after cropping the main image', async () => {
  const originalBytes = await sharp({
    create: { channels: 3, background: 'red', height: 50, width: 100 },
  })
    .png()
    .toBuffer()
  const croppedBytes = await sharp(originalBytes)
    .extract({ height: 20, left: 0, top: 0, width: 40 })
    .png()
    .toBuffer()
  const originalFile = new File([originalBytes], 'photo.png', { type: 'image/png' })
  const croppedFile = new File([croppedBytes], 'photo.png', { type: 'image/png' })
  const transform = vi.fn(async ({ fieldPath }) =>
    fieldPath === 'filename' ? croppedFile : originalFile,
  )
  const prepare = createPrepareLegacyUpload({
    collections: { media: { imageSizes: [{ height: 10, name: 'small', width: 20 }] } },
    sharpDependency: sharp,
  })

  await prepare({
    collectionSlug: 'media',
    file: originalFile,
    req: {} as never,
    transform,
    uploadEdits: {
      crop: { height: 40, unit: '%', width: 40, x: 0, y: 0 },
      heightInPixels: 20,
      widthInPixels: 40,
    },
  })

  const sizeTask = transform.mock.calls.find(([task]) => task.fieldPath === 'sizes.small')?.[0]

  expect(sizeTask?.file).toBeUndefined()
  expect(sizeTask?.options.originalDimensions).toEqual({ height: 50, width: 100 })
})
