import type { PayloadRequest } from 'payload'
import type { UploadTransformTask } from 'payload/internal'

import { crc32, createDeflate } from 'node:zlib'
import { describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'

import type { SharpCollectionConfig, SharpDependency, SharpUploadTaskOptions } from './types.js'

import { DEFAULT_MAX_INPUT_PIXELS } from './types.js'
import { createTransformUpload } from './createTransformUpload.js'

/**
 * Builds a valid 1-bit grayscale PNG of the requested size without holding the
 * raw image in memory: reaching Sharp's 268,402,689-pixel default limit needs
 * a huge image, and a flat-colour PNG compresses to kilobytes. Each scanline
 * is a filter byte plus zero bytes, streamed through zlib.
 */
const makeOversizedPng = async ({
  height,
  width,
}: {
  height: number
  width: number
}): Promise<Buffer> => {
  const pngChunk = (type: string, data: Buffer): Buffer => {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const typeAndData = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(typeAndData))
    return Buffer.concat([length, typeAndData, crc])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 1 // 1-bit depth
  ihdr[9] = 0 // grayscale

  const row = Buffer.alloc(1 + Math.ceil(width / 8))
  // Feed the deflater in ~1 MB chunks instead of one tiny write per row.
  const rowsPerChunk = Math.max(1, Math.floor((1024 * 1024) / row.length))
  const chunkBuffer = Buffer.alloc(row.length * rowsPerChunk)
  const deflate = createDeflate({ level: 1 })
  const parts: Buffer[] = []
  deflate.on('data', (chunk) => parts.push(chunk as Buffer))
  const finished = new Promise<void>((resolve, reject) => {
    deflate.on('end', resolve)
    deflate.on('error', reject)
  })
  for (let y = 0; y < height; y += rowsPerChunk) {
    const rows = Math.min(rowsPerChunk, height - y)
    const slice = rows === rowsPerChunk ? chunkBuffer : chunkBuffer.subarray(0, rows * row.length)
    if (!deflate.write(slice)) {
      await new Promise<void>((resolve) => deflate.once('drain', resolve))
    }
  }
  deflate.end()
  await finished

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', Buffer.concat(parts)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

let oversizedPng: Promise<Buffer> | undefined
const getOversizedPng = (): Promise<Buffer> =>
  (oversizedPng ??= makeOversizedPng({ height: 20000, width: 20000 }))

const sharpDependency = (() => ({
  metadata: async () => ({ height: 1000, width: 1000 }),
})) as unknown as SharpDependency

const makeReq = ({ focalPoint }: { focalPoint?: boolean }): PayloadRequest =>
  ({
    payload: { collections: { media: { config: { upload: { focalPoint } } } } },
  }) as unknown as PayloadRequest

const runTransformUpload = async ({
  collectionFocalPoint,
  sharpConfig,
}: {
  collectionFocalPoint?: boolean
  sharpConfig: SharpCollectionConfig
}) => {
  const transform = vi.fn(
    async (_task: UploadTransformTask) => new File(['x'], 'image.png', { type: 'image/png' }),
  )

  await createTransformUpload({
    collections: { media: sharpConfig },
    maxInputPixels: DEFAULT_MAX_INPUT_PIXELS,
    sharpDependency,
  })({
    collectionSlug: 'media',
    file: new File(['x'], 'image.png', { type: 'image/png' }),
    req: makeReq({ focalPoint: collectionFocalPoint }),
    transform,
  })

  const sizeTask = transform.mock.calls
    .map(([task]) => task.options as SharpUploadTaskOptions)
    .find((options) => options.kind === 'size')

  return sizeTask?.kind === 'size' ? sizeTask.canUseFocalPoint : undefined
}

const variants = [{ name: 'card', height: 200, width: 400 }]

describe('createTransformUpload', () => {
  it.each([
    { collectionFocalPoint: false, expected: false, sharpFocalPoint: undefined },
    { collectionFocalPoint: false, expected: true, sharpFocalPoint: true },
    { collectionFocalPoint: undefined, expected: true, sharpFocalPoint: undefined },
  ])(
    'should let sizes use a saved focal point when Sharp ($sharpFocalPoint) or else the collection ($collectionFocalPoint) enables it',
    async ({ collectionFocalPoint, expected, sharpFocalPoint }) => {
      expect(
        await runTransformUpload({
          collectionFocalPoint,
          sharpConfig: { focalPoint: sharpFocalPoint, variants },
        }),
      ).toEqual(expected)
    },
  )

  describe('maxInputPixels', () => {
    const runUpload = async ({
      maxInputPixels,
      metadata,
      sharpConfig,
    }: {
      maxInputPixels: number
      metadata: { height: number; pages?: number; width: number }
      sharpConfig?: SharpCollectionConfig
    }) => {
      const probingSharp = (() => ({
        metadata: async () => metadata,
      })) as unknown as SharpDependency
      const transform = vi.fn(
        async (_task: UploadTransformTask) => new File(['x'], 'image.png', { type: 'image/png' }),
      )

      const promise = createTransformUpload({
        collections: { media: sharpConfig ?? {} },
        maxInputPixels,
        sharpDependency: probingSharp,
      })({
        collectionSlug: 'media',
        file: new File(['x'], 'image.png', { type: 'image/png' }),
        req: makeReq({}),
        transform,
      })

      return { promise, transform }
    }

    it('should refuse a 12000x12000 source (144M pixels) over the 50M default with a 400, before any transform runs', async () => {
      const { promise, transform } = await runUpload({
        maxInputPixels: DEFAULT_MAX_INPUT_PIXELS,
        metadata: { height: 12000, width: 12000 },
      })

      // `ValidationError` keeps its 400 status through core's upload error mapping;
      // the specific reason lives in `data.errors`, its top-level message is generic.
      await expect(promise).rejects.toMatchObject({ name: 'ValidationError', status: 400 })
      const error = await promise.then(
        () => {
          throw new Error('expected the upload to be refused')
        },
        (err) => err as { data: { errors: { message: string }[] } },
      )
      expect(error.data.errors[0]?.message).toContain(
        '144000000 pixels), which exceeds the maximum input size of 50000000 pixels',
      )
      expect(transform).not.toHaveBeenCalled()
    })

    it('should count every frame of an animated source against the cap', async () => {
      // 200x200 across 44 frames is 1,760,000 pixels — over a 1,000,000 cap,
      // even though one frame alone (40,000) is far under it.
      const { promise } = await runUpload({
        maxInputPixels: 1_000_000,
        metadata: { height: 200, pages: 44, width: 200 },
      })

      await expect(promise).rejects.toMatchObject({ name: 'ValidationError', status: 400 })
      const error = await promise.then(
        () => {
          throw new Error('expected the upload to be refused')
        },
        (err) => err as { data: { errors: { message: string }[] } },
      )
      expect(error.data.errors[0]?.message).toContain('across 44 frames (1760000 pixels)')
    })

    it("should let a collection's own maxInputPixels override the global cap", async () => {
      const { promise, transform } = await runUpload({
        maxInputPixels: DEFAULT_MAX_INPUT_PIXELS,
        metadata: { height: 12000, width: 12000 },
        sharpConfig: { maxInputPixels: 200_000_000 },
      })

      await expect(promise).resolves.toBeDefined()
      expect(transform).toHaveBeenCalled()
    })

    it('should refuse a 20000x20000 source (400M pixels) over the 50M default with a 400, even though it also exceeds Sharp\u2019s own 268M default', async () => {
      // Sharp enforces its own 268,402,689-pixel default even on `metadata()`,
      // so without an explicitly uncapped probe the upload would never reach
      // this PR's 400 validation — the probe would fail and the oversized
      // source would be returned unprocessed instead.
      const buffer = await getOversizedPng()
      const transform = vi.fn(
        async (_task: UploadTransformTask) => new File(['x'], 'image.png', { type: 'image/png' }),
      )

      const promise = createTransformUpload({
        collections: { media: {} },
        maxInputPixels: DEFAULT_MAX_INPUT_PIXELS,
        sharpDependency: sharp,
      })({
        collectionSlug: 'media',
        file: new File([buffer], 'big.png', { type: 'image/png' }),
        req: makeReq({}),
        transform,
      })

      await expect(promise).rejects.toMatchObject({ name: 'ValidationError', status: 400 })
      const error = await promise.then(
        () => {
          throw new Error('expected the upload to be refused')
        },
        (err) => err as { data: { errors: { message: string }[] } },
      )
      expect(error.data.errors[0]?.message).toContain(
        '400000000 pixels), which exceeds the maximum input size of 50000000 pixels',
      )
      expect(transform).not.toHaveBeenCalled()
      // Generating the 20000x20000 fixture streams ~50 MB through zlib.
    }, 30_000)

    it('should accept a source within the cap', async () => {
      const { promise, transform } = await runUpload({
        maxInputPixels: DEFAULT_MAX_INPUT_PIXELS,
        metadata: { height: 1000, width: 1000 },
      })

      await expect(promise).resolves.toBeDefined()
      expect(transform).toHaveBeenCalled()
    })
  })
})
