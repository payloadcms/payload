import type { PayloadRequest } from 'payload'

import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

import type { SharpUploadTaskOptions } from './types.js'

import { createTransformFile } from './transformFile.js'

const makeReq = (): PayloadRequest => ({}) as PayloadRequest

const toBuffer = async (file: File): Promise<Buffer> => Buffer.from(await file.arrayBuffer())

const makeImageBuffer = async ({
  background = { b: 0, g: 128, r: 255 },
  format = 'png' as const,
  height,
  width,
}: {
  background?: { b: number; g: number; r: number }
  format?: 'gif' | 'png' | 'webp'
  height: number
  width: number
}): Promise<Buffer> =>
  sharp({ create: { background, channels: 3, height, width } })
    .toFormat(format)
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
    it('should return status continue without invoking Sharp when there is no crop and no configured adjustments', async () => {
      const buffer = await makeImageBuffer({ height: 10, width: 10 })
      const file = new File([buffer], 'photo.png', { type: 'image/png' })
      const sharpSpy = vi.fn(sharp)
      const transformFile = createTransformFile({ sharpDependency: sharpSpy as never })

      const result = await transformFile({
        file,
        options: { collectionUpload: {}, kind: 'main' } satisfies SharpUploadTaskOptions,
        req: makeReq(),
      })

      expect(result).toEqual({ status: 'continue' })
      expect(sharpSpy).not.toHaveBeenCalled()
    })

    it('should resize the main file according to resizeOptions', async () => {
      const buffer = await makeImageBuffer({ height: 200, width: 400 })
      const file = new File([buffer], 'photo.png', { type: 'image/png' })
      const transformFile = createTransformFile({ sharpDependency: sharp })

      const result = await transformFile({
        file,
        options: {
          collectionUpload: { resizeOptions: { width: 100 } },
          kind: 'main',
        } satisfies SharpUploadTaskOptions,
        req: makeReq(),
      })

      expect(result.status).toBe('continue')
      const metadata = await sharp(await toBuffer(result.file!)).metadata()
      expect(metadata.width).toBe(100)
      expect(metadata.height).toBe(50)
    })

    it('should convert the main file to the configured output format', async () => {
      const buffer = await makeImageBuffer({ height: 20, width: 20 })
      const file = new File([buffer], 'photo.png', { type: 'image/png' })
      const transformFile = createTransformFile({ sharpDependency: sharp })

      const result = await transformFile({
        file,
        options: {
          collectionUpload: { formatOptions: { format: 'webp' } },
          kind: 'main',
        } satisfies SharpUploadTaskOptions,
        req: makeReq(),
      })

      const metadata = await sharp(await toBuffer(result.file!)).metadata()
      expect(metadata.format).toBe('webp')
      // `.file.type` stays the caller's original MIME type; generateFileData.ts
      // re-derives the real type from the encoded bytes later, not from this field.
      expect(result.file!.type).toBe('image/png')
    })

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

    describe('crop', () => {
      it('should skip the extract call when the requested crop dimensions equal the original dimensions', async () => {
        const buffer = await makeImageBuffer({ height: 50, width: 50 })
        const file = new File([buffer], 'photo.png', { type: 'image/png' })
        const transformFile = createTransformFile({ sharpDependency: sharp })

        const result = await transformFile({
          file,
          options: {
            collectionUpload: {},
            crop: {
              cropData: { height: 100, unit: '%', width: 100, x: 0, y: 0 },
              heightInPixels: 50,
              originalDimensions: { height: 50, width: 50 },
              widthInPixels: 50,
            },
            kind: 'main',
          } satisfies SharpUploadTaskOptions,
          req: makeReq(),
        })

        expect(Buffer.compare(await toBuffer(result.file!), buffer)).toBe(0)
      })

      it('should extract exactly the cropped pixel region when resizeOptions are not configured', async () => {
        const buffer = await makeImageBuffer({ height: 100, width: 100 })
        const file = new File([buffer], 'photo.png', { type: 'image/png' })
        const transformFile = createTransformFile({ sharpDependency: sharp })

        const result = await transformFile({
          file,
          options: {
            collectionUpload: {},
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
        expect(metadata.width).toBe(40)
        expect(metadata.height).toBe(40)
      })

      it('should re-apply resizeOptions to the crop output by default', async () => {
        const buffer = await makeImageBuffer({ height: 100, width: 100 })
        const file = new File([buffer], 'photo.png', { type: 'image/png' })
        const transformFile = createTransformFile({ sharpDependency: sharp })

        const result = await transformFile({
          file,
          options: {
            collectionUpload: { resizeOptions: { fit: 'cover', height: 20, width: 20 } },
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
        expect(metadata.width).toBe(20)
        expect(metadata.height).toBe(20)
      })

      it('should not re-apply resizeOptions to the crop output when withoutEnlargement is set', async () => {
        const buffer = await makeImageBuffer({ height: 100, width: 100 })
        const file = new File([buffer], 'photo.png', { type: 'image/png' })
        const transformFile = createTransformFile({ sharpDependency: sharp })

        const result = await transformFile({
          file,
          options: {
            collectionUpload: {
              resizeOptions: { height: 20, width: 20, withoutEnlargement: true },
            },
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
        expect(metadata.width).toBe(40)
        expect(metadata.height).toBe(40)
      })
    })
  })

  describe('size (transformSize)', () => {
    it('should resize to the named image size configuration when no focal point is provided', async () => {
      const buffer = await makeImageBuffer({ height: 200, width: 400 })
      const file = new File([buffer], 'photo.png', { type: 'image/png' })
      const transformFile = createTransformFile({ sharpDependency: sharp })

      const result = await transformFile({
        file,
        options: {
          collectionUpload: {},
          imageResizeConfig: { name: 'thumb', height: 100, width: 100 },
          kind: 'size',
          originalDimensions: { height: 200, width: 400 },
        } satisfies SharpUploadTaskOptions,
        req: makeReq(),
      })

      const metadata = await sharp(await toBuffer(result.file!)).metadata()
      expect(metadata.width).toBe(100)
      expect(metadata.height).toBe(100)
    })

    it('should extract the horizontally-correct focal-point region for a landscape original', async () => {
      // 200x100 (2:1) forces `prioritizeHeight` (resize to 100x50); focal x:80
      // pushes the 50px-wide extract window against the clamped right edge, so
      // a correct crop is entirely blue.
      const buffer = await makeTwoColorImage({ height: 100, splitAxis: 'x', width: 200 })
      const file = new File([buffer], 'photo.png', { type: 'image/png' })
      const transformFile = createTransformFile({ sharpDependency: sharp })

      const result = await transformFile({
        file,
        options: {
          collectionUpload: {},
          focalPoint: { x: 80, y: 50 },
          imageResizeConfig: { name: 'thumb', height: 50, width: 50 },
          kind: 'size',
          originalDimensions: { height: 100, width: 200 },
        } satisfies SharpUploadTaskOptions,
        req: makeReq(),
      })

      const { data, info } = await sharp(await toBuffer(result.file!))
        .raw()
        .toBuffer({ resolveWithObject: true })
      expect(info.width).toBe(50)
      expect(info.height).toBe(50)
      expect(sampleRawPixel({ data, info, x: 10, y: 25 })).toEqual({ b: 255, g: 0, r: 0 })
      expect(sampleRawPixel({ data, info, x: 40, y: 25 })).toEqual({ b: 255, g: 0, r: 0 })
    })

    it('should extract the vertically-correct focal-point region for a portrait original', async () => {
      // 100x200 (1:2) forces the width-priority branch (resize to 50x100); focal
      // y:80 pushes the 50px-tall extract window against the clamped bottom edge,
      // so a correct crop is entirely blue.
      const buffer = await makeTwoColorImage({ height: 200, splitAxis: 'y', width: 100 })
      const file = new File([buffer], 'photo.png', { type: 'image/png' })
      const transformFile = createTransformFile({ sharpDependency: sharp })

      const result = await transformFile({
        file,
        options: {
          collectionUpload: {},
          focalPoint: { x: 50, y: 80 },
          imageResizeConfig: { name: 'thumb', height: 50, width: 50 },
          kind: 'size',
          originalDimensions: { height: 200, width: 100 },
        } satisfies SharpUploadTaskOptions,
        req: makeReq(),
      })

      const { data, info } = await sharp(await toBuffer(result.file!))
        .raw()
        .toBuffer({ resolveWithObject: true })
      expect(info.width).toBe(50)
      expect(info.height).toBe(50)
      expect(sampleRawPixel({ data, info, x: 25, y: 10 })).toEqual({ b: 255, g: 0, r: 0 })
      expect(sampleRawPixel({ data, info, x: 25, y: 40 })).toEqual({ b: 255, g: 0, r: 0 })
    })
  })
})
