import type { PayloadRequest } from 'payload'
import type { UploadTransformTask } from 'payload/internal'

import { describe, expect, it, vi } from 'vitest'

import type { SharpCollectionConfig, SharpDependency, SharpUploadTaskOptions } from './types.js'

import { DEFAULT_MAX_INPUT_PIXELS } from './types.js'
import { createTransformUpload } from './createTransformUpload.js'

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
