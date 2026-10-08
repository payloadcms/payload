import { createFileSource } from '../../payload/src/uploads/transformers/createFileSource.js'
import type { PayloadRequest } from 'payload'

import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import type { SharpDependency, SharpUploadTaskOptions, WithMetadata } from './types.js'

import { resolveFocalPoint } from './resolveFocalPoint.js'
import { createTransformFile } from './transformFile.js'
import { transformState } from './transformState.js'

const makeReq = (): PayloadRequest => ({}) as PayloadRequest

const toBuffer = async (file: File): Promise<Buffer> => Buffer.from(await file.arrayBuffer())

const makeImageBuffer = async ({
  background = { b: 0, g: 128, r: 255 },
  height,
  width,
}: {
  background?: { b: number; g: number; r: number }
  height: number
  width: number
}): Promise<Buffer> =>
  sharp({ create: { background, channels: 3, height, width } })
    .png()
    .toBuffer()

/**
 * A two-colour image split along `splitAxis` (red/blue halves) — proves the
 * focal-point extract region in `transformSize` lands where the math says,
 * not just that the output dimensions are right.
 */
const makeTwoColorImage = async ({
  height,
  splitAxis,
  width,
}: {
  height: number
  splitAxis: 'x' | 'y'
  width: number
}): Promise<Buffer> => {
  const raw = Buffer.alloc(width * height * 3)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3
      const isFirstHalf = splitAxis === 'x' ? x < width / 2 : y < height / 2

      if (isFirstHalf) {
        raw[idx] = 255 // red
      } else {
        raw[idx + 2] = 255 // blue
      }
    }
  }

  return sharp(raw, { raw: { channels: 3, height, width } })
    .png()
    .toBuffer()
}

const sampleRawPixel = ({
  data,
  info,
  x,
  y,
}: {
  data: Buffer
  info: { channels: number; width: number }
  x: number
  y: number
}): { b: number; g: number; r: number } => {
  const idx = (y * info.width + x) * info.channels
  return { b: data[idx + 2]!, g: data[idx + 1]!, r: data[idx]! }
}

describe('createTransformFile', () => {
  it('should apply saved encoding options once at the final output boundary', async () => {
    const buffer = await makeImageBuffer({ width: 20, height: 10 })
    let encodingCount = 0
    const sharpDependency: SharpDependency = (input, options) => {
      const image = sharp(input, options)
      const toFormat = image.toFormat.bind(image)
      image.toFormat = (format, encoding) => {
        if (encoding?.progressive) {
          encodingCount++
        }
        return toFormat(format, encoding)
      }
      return image
    }
    const result = await createTransformFile({ sharpDependency })({
      source: createFileSource({ file: new File([buffer], 'source.png', { type: 'image/png' }) }),
      doc: { _transforms: { rotate: { angle: 90 }, encoding: { progressive: true } } },
      originalDoc: {},
      options: { kind: 'main', collectionUpload: { formatOptions: { format: 'jpeg' } } },
      req: makeReq(),
    })
    const metadata = await sharp(Buffer.from(await result.file!.arrayBuffer())).metadata()

    expect(metadata).toMatchObject({ format: 'jpeg', width: 10, height: 20, isProgressive: true })
    expect(encodingCount).toBe(1)
  })

  it.each(['main', 'size'] as const)(
    'should retain saved metadata and encoding through configured %s processing',
    async (kind) => {
      const buffer = await sharp({
        create: { width: 20, height: 10, channels: 3, background: 'red' },
      })
        .withMetadata({ density: 300 })
        .jpeg()
        .toBuffer()
      const file = new File([buffer], 'metadata.jpg', { type: 'image/jpeg' })
      const options: SharpUploadTaskOptions =
        kind === 'main'
          ? { kind, collectionUpload: { resizeOptions: { width: 10 } } }
          : {
              kind,
              collectionUpload: {},
              originalDimensions: { width: 20, height: 10 },
              imageResizeConfig: { name: 'small', width: 10 },
            }
      const result = await createTransformFile({ sharpDependency: sharp })({
        source: createFileSource({ file }),
        doc: {
          _transforms: { metadataPolicy: { mode: 'preserve' }, encoding: { progressive: true } },
        },
        originalDoc: {},
        options,
        req: makeReq(),
      })
      const metadata = await sharp(Buffer.from(await result.file!.arrayBuffer())).metadata()

      expect(metadata.exif).toBeDefined()
      expect(metadata.density).toBe(300)
      expect(metadata.isProgressive).toBe(true)
    },
  )

  it.each(['preserve', 'callback-preserve', 'callback-strip', 'saved-strip'] as const)(
    'should inherit collection metadata policy through saved geometry (%s)',
    async (policy) => {
      const buffer = await sharp(await makeImageBuffer({ width: 20, height: 10 }))
        .withMetadata({ density: 300 })
        .jpeg()
        .toBuffer()
      let callbackCalls = 0
      const withMetadata: WithMetadata =
        policy === 'preserve' || policy === 'saved-strip'
          ? true
          : ({ metadata }) => {
              callbackCalls++
              return policy === 'callback-preserve' && metadata.density === 300
            }
      const result = await createTransformFile({ sharpDependency: sharp })({
        source: createFileSource({
          file: new File([buffer], 'source.jpg', { type: 'image/jpeg' }),
        }),
        doc: {
          _transforms: {
            rotate: { angle: 90 },
            ...(policy === 'saved-strip' ? { metadataPolicy: { mode: 'strip' as const } } : {}),
          },
        },
        originalDoc: {},
        options: { kind: 'main', collectionUpload: { withMetadata } },
        req: makeReq(),
      })
      const metadata = await sharp(Buffer.from(await result.file!.arrayBuffer())).metadata()

      expect(metadata).toMatchObject({ width: 10, height: 20 })
      if (policy === 'callback-strip' || policy === 'saved-strip') {
        expect(metadata.exif).toBeUndefined()
      } else {
        expect(metadata.exif).toBeDefined()
        expect(metadata.density).toBe(300)
      }
      expect(callbackCalls).toBe(policy === 'preserve' || policy === 'saved-strip' ? 0 : 1)
    },
  )

  it.each([false, true])(
    'should retain passthrough behavior without saved intent or configured adjustments (metadata: %s)',
    async (withMetadata) => {
      const buffer = await makeImageBuffer({ width: 20, height: 10 })
      const result = await createTransformFile({ sharpDependency: sharp })({
        source: createFileSource({ file: new File([buffer], 'source.png', { type: 'image/png' }) }),
        doc: {},
        originalDoc: {},
        options: { kind: 'main', collectionUpload: { withMetadata } },
        req: makeReq(),
      })

      expect(result).toEqual({ status: 'continue' })
    },
  )

  describe('main (transformMain)', () => {
    it('should trim uniform-colour padding from the main file', async () => {
      const square = await makeImageBuffer({
        background: { b: 0, g: 0, r: 0 },
        height: 20,
        width: 20,
      })
      const framed = await sharp({
        create: { background: { b: 255, g: 255, r: 255 }, channels: 3, height: 60, width: 60 },
      })
        .composite([{ input: square, left: 20, top: 20 }])
        .png()
        .toBuffer()
      const file = new File([framed], 'photo.png', { type: 'image/png' })
      const transformFile = createTransformFile({ sharpDependency: sharp })

      const result = await transformFile({
        source: createFileSource({ file }),
        doc: {},
        originalDoc: {},
        options: {
          collectionUpload: { trimOptions: {} },
          kind: 'main',
        } satisfies SharpUploadTaskOptions,
        req: makeReq(),
      })

      const metadata = await sharp(await toBuffer(result.file!)).metadata()
      expect(metadata.width).toBe(20)
      expect(metadata.height).toBe(20)
    })

    it.each([
      // Re-applied by default, so the 40x40 crop is resized down to 20x20.
      { expectedSize: 20, resizeOptions: { fit: 'cover' as const, height: 20, width: 20 } },
      { expectedSize: 40, resizeOptions: { height: 20, width: 20, withoutEnlargement: true } },
    ])(
      'should re-apply resizeOptions to the crop output unless withoutEnlargement is set (%#)',
      async ({ expectedSize, resizeOptions }) => {
        const buffer = await makeImageBuffer({ height: 100, width: 100 })
        const file = new File([buffer], 'photo.png', { type: 'image/png' })
        const transformFile = createTransformFile({ sharpDependency: sharp })

        const result = await transformFile({
          source: createFileSource({ file }),
          doc: {},
          originalDoc: {},
          options: {
            collectionUpload: { resizeOptions },
            crop: {
              cropData: { height: 40, unit: '%', width: 40, x: 25, y: 25 },
              heightInPixels: 40,
              originalDimensions: { height: 100, width: 100 },
              widthInPixels: 40,
            },
            kind: 'main',
          } satisfies SharpUploadTaskOptions,
          req: makeReq(),
        })

        const metadata = await sharp(await toBuffer(result.file!)).metadata()
        expect(metadata.width).toBe(expectedSize)
        expect(metadata.height).toBe(expectedSize)
      },
    )
  })

  describe('size (transformSize)', () => {
    // Each original forces one resize-priority branch, and a focal point at 80% pushes the
    // 50px extract window against the clamped far edge, so a correct crop is entirely blue.
    it.each([
      {
        focalPoint: { x: 80, y: 50 },
        original: { height: 100, splitAxis: 'x' as const, width: 200 },
        samples: [
          { x: 10, y: 25 },
          { x: 40, y: 25 },
        ],
      },
      {
        focalPoint: { x: 50, y: 80 },
        original: { height: 200, splitAxis: 'y' as const, width: 100 },
        samples: [
          { x: 25, y: 10 },
          { x: 25, y: 40 },
        ],
      },
    ])(
      'should extract the focal-point region along the $original.splitAxis axis',
      async ({ focalPoint, original, samples }) => {
        const buffer = await makeTwoColorImage(original)
        const file = new File([buffer], 'photo.png', { type: 'image/png' })
        const transformFile = createTransformFile({ sharpDependency: sharp })

        const result = await transformFile({
          source: createFileSource({ file }),
          doc: {},
          originalDoc: {},
          options: {
            collectionUpload: {},
            focalPoint,
            imageResizeConfig: { name: 'thumb', height: 50, width: 50 },
            kind: 'size',
            originalDimensions: { height: original.height, width: original.width },
          } satisfies SharpUploadTaskOptions,
          req: makeReq(),
        })

        const { data, info } = await sharp(await toBuffer(result.file!))
          .raw()
          .toBuffer({ resolveWithObject: true })
        expect(info.width).toBe(50)
        expect(info.height).toBe(50)
        for (const { x, y } of samples) {
          expect(sampleRawPixel({ data, info, x, y })).toEqual({ b: 255, g: 0, r: 0 })
        }
      },
    )
  })
})

describe('Sharp persisted transform state', () => {
  it.each([
    { resize: { width: 9 }, limits: { maxWidth: 8, maxHeight: 8, maxPixels: 64 } },
    { resize: { height: 9 }, limits: { maxWidth: 8, maxHeight: 8, maxPixels: 64 } },
    { resize: { width: 8, height: 8 }, limits: { maxWidth: 8, maxHeight: 8, maxPixels: 32 } },
    {
      resize: { width: 8, height: 8, fit: 'outside' as const },
      limits: { maxWidth: 8, maxHeight: 8, maxPixels: 64 },
    },
  ])('should reject saved resizing beyond output limits (%#)', async ({ resize, limits }) => {
    const buffer = await makeImageBuffer({ width: 20, height: 10 })

    await expect(
      transformState({
        buffer,
        filename: 'source.png',
        mimeType: 'image/png',
        sharpDependency: sharp,
        state: { resize },
        limits,
      }),
    ).rejects.toThrow('maximum')
  })

  it('should bound the intermediate focal-cover image even when its final crop fits', async () => {
    const buffer = await makeImageBuffer({ width: 20, height: 10 })
    const args = {
      buffer,
      filename: 'focal.png',
      mimeType: 'image/png',
      sharpDependency: sharp,
      state: { focalPoint: { x: 0, y: 50 }, resize: { width: 8, height: 8 } },
    }

    await expect(
      transformState({ ...args, limits: { maxWidth: 8, maxHeight: 8, maxPixels: 64 } }),
    ).rejects.toThrow('maximum')
    const accepted = await transformState({
      ...args,
      limits: { maxWidth: 16, maxHeight: 8, maxPixels: 128 },
    })
    expect(await sharp(await toBuffer(accepted)).metadata()).toMatchObject({ width: 8, height: 8 })
  })

  it('should crop animated focal resizing using per-frame geometry', async () => {
    const raw = Buffer.alloc(20 * 20 * 3)

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        raw[(y * 20 + x) * 3 + (y < 10 ? (x < 10 ? 0 : 2) : 1)] = 255
      }
    }
    const buffer = await sharp(raw, { raw: { width: 20, height: 20, channels: 3, pageHeight: 10 } })
      .gif({ delay: [100, 200], loop: 2 })
      .toBuffer()
    const file = await transformState({
      buffer,
      filename: 'animation.gif',
      mimeType: 'image/gif',
      sharpDependency: sharp,
      state: { resize: { width: 10, height: 10 }, focalPoint: { x: 0, y: 50 } },
    })
    const output = await toBuffer(file)
    const metadata = await sharp(output, { animated: true }).metadata()
    const { data, info } = await sharp(output, { animated: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    expect(metadata).toMatchObject({
      width: 10,
      pageHeight: 10,
      pages: 2,
      delay: [100, 200],
      loop: 2,
    })
    expect(sampleRawPixel({ data, info, x: 9, y: 5 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(sampleRawPixel({ data, info, x: 9, y: 15 })).toEqual({ r: 0, g: 255, b: 0 })
    await expect(
      transformState({
        buffer,
        filename: 'animation.gif',
        mimeType: 'image/gif',
        sharpDependency: sharp,
        state: { resize: { width: 10, height: 10 } },
        limits: { maxWidth: 10, maxHeight: 10, maxPixels: 100 },
      }),
    ).rejects.toThrow('maximum')
  })

  it('should avoid enlarging a focal cover resize', async () => {
    const buffer = await makeImageBuffer({ width: 20, height: 10 })
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
    const buffer = await makeTwoColorImage({ width: 20, height: 10, splitAxis: 'x' })
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
    const buffer = await makeImageBuffer({ width: 20, height: 10 })
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

describe('focal points after saved resizing', () => {
  it('should map a point into the cover crop used by the saved default', () => {
    expect(
      resolveFocalPoint({
        width: 20,
        height: 10,
        state: { focalPoint: { x: 75, y: 50 }, resize: { width: 10, height: 10 } },
      }),
    ).toEqual({ x: 50, y: 50 })
  })

  it('should retain an edge point when the cover crop is clamped to the source', () => {
    expect(
      resolveFocalPoint({
        width: 20,
        height: 10,
        state: { focalPoint: { x: 0, y: 0 }, resize: { width: 10, height: 10 } },
      }),
    ).toEqual({ x: 0, y: 0 })
  })
})
