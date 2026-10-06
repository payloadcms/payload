import type { PayloadRequest } from 'payload'

import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import type { SharpUploadTaskOptions } from './types.js'

import { createTransformFile } from './transformFile.js'

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
        file,
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
          file,
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
          file,
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
