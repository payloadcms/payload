import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { transformState } from './transformState.js'

describe('Sharp persisted transform state', () => {
  it('should avoid enlarging a focal cover resize', async () => {
    const buffer = await sharp({
      create: { width: 20, height: 10, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer()
    const file = await transformState({
      buffer,
      filename: 'small.png',
      mimeType: 'image/png',
      sharpDependency: sharp,
      state: {
        resize: { width: 40, height: 40, withoutEnlargement: true },
        focalPoint: { x: 0, y: 0 },
      },
    })
    const metadata = await sharp(Buffer.from(await file.arrayBuffer())).metadata()

    expect(metadata).toMatchObject({ width: 20, height: 10 })
  })

  it('should preserve embedded metadata through crop and resize when requested', async () => {
    const buffer = await sharp({
      create: { width: 20, height: 10, channels: 3, background: 'red' },
    })
      .withExif({ IFD0: { Copyright: 'editorial-copyright' } })
      .jpeg()
      .toBuffer()
    const result = await transformState({
      buffer,
      filename: 'metadata.jpg',
      mimeType: 'image/jpeg',
      sharpDependency: sharp,
      state: {
        crop: { x: 0, y: 0, width: 10, height: 10 },
        resize: { width: 5 },
        metadataPolicy: { mode: 'preserve' },
      },
    })
    const metadata = await sharp(Buffer.from(await result.arrayBuffer())).metadata()

    expect(metadata.exif?.includes(Buffer.from('editorial-copyright'))).toBe(true)
  })

  it('should position a cover resize around an original-space focal point', async () => {
    const buffer = await sharp({
      create: { width: 20, height: 10, channels: 3, background: 'red' },
    })
      .composite([
        {
          input: await sharp({ create: { width: 10, height: 10, channels: 3, background: 'blue' } })
            .png()
            .toBuffer(),
          left: 10,
          top: 0,
        },
      ])
      .png()
      .toBuffer()
    const file = await transformState({
      buffer,
      filename: 'focal.png',
      mimeType: 'image/png',
      sharpDependency: sharp,
      state: { resize: { width: 10, height: 10 }, focalPoint: { x: 0, y: 0 } },
    })
    const { data } = await sharp(Buffer.from(await file.arrayBuffer()))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    expect([...data.subarray((5 * 10 + 9) * 3, (5 * 10 + 9) * 3 + 3)]).toEqual([255, 0, 0])
  })

  it('should apply an original-pixel crop before resize', async () => {
    const buffer = await sharp({
      create: { width: 20, height: 10, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer()
    const result = await transformState({
      buffer,
      filename: 'source.png',
      mimeType: 'image/png',
      sharpDependency: sharp,
      state: { crop: { x: 10, y: 0, width: 10, height: 10 }, resize: { width: 5 } },
    })
    const metadata = await sharp(Buffer.from(await result.arrayBuffer())).metadata()

    expect(metadata).toMatchObject({ width: 5, height: 5 })
    expect(result.type).toBe('image/png')
  })

  it('should return MIME metadata matching the resulting bytes', async () => {
    const buffer = await sharp({
      create: { width: 20, height: 10, channels: 3, background: 'red' },
    })
      .jpeg()
      .toBuffer()
    const result = await transformState({
      buffer,
      filename: 'source.jpg',
      mimeType: 'image/jpeg',
      sharpDependency: sharp,
      state: { rotate: { angle: 90 }, encoding: { quality: 75 } },
    })
    const metadata = await sharp(Buffer.from(await result.arrayBuffer())).metadata()

    expect(metadata).toMatchObject({ width: 10, height: 20, format: 'jpeg' })
    expect(result.type).toBe('image/jpeg')
  })
})
