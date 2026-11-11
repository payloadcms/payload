import type { PayloadRequest, UploadEdits } from 'payload'
import type { UploadTransformTask } from 'payload/internal'

import { describe, expect, it, vi } from 'vitest'

import type { SharpCollectionConfig, SharpDependency, SharpUploadTaskOptions } from './types.js'

import { createPrepareLegacyUpload } from './prepareLegacyUpload.js'

const createSharpDependency = (metadata: { height: number; orientation?: number; width: number }) =>
  (() => ({
    metadata: async () => metadata,
  })) as unknown as SharpDependency

const sharpDependency = createSharpDependency({ height: 1000, width: 1000 })

const makeReq = ({ focalPoint }: { focalPoint?: boolean }): PayloadRequest =>
  ({
    payload: { collections: { media: { config: { upload: { focalPoint } } } } },
  }) as unknown as PayloadRequest

const runPrepareUpload = async ({
  collectionFocalPoint,
  sharp = sharpDependency,
  sharpConfig,
}: {
  collectionFocalPoint?: boolean
  sharp?: SharpDependency
  sharpConfig: SharpCollectionConfig
}) => {
  const transform = vi.fn(
    async (_task: UploadTransformTask) => new File(['x'], 'image.png', { type: 'image/png' }),
  )

  await createPrepareLegacyUpload({
    collections: { media: sharpConfig },
    sharpDependency: sharp,
  })({
    collectionSlug: 'media',
    file: new File(['x'], 'image.png', { type: 'image/png' }),
    req: makeReq({ focalPoint: collectionFocalPoint }),
    transform,
    uploadEdits: { focalPoint: { x: 10, y: 90 } } as UploadEdits,
  })

  const sizeTask = transform.mock.calls
    .map(([task]) => task.options as SharpUploadTaskOptions)
    .find((options) => options.kind === 'size')

  expect(sizeTask?.kind).toBe('size')

  return sizeTask?.kind === 'size' ? sizeTask.focalPoint : undefined
}

const variants = [{ name: 'card', height: 200, width: 400 }]

describe('createPrepareLegacyUpload', () => {
  it.each([
    { collectionFocalPoint: false, expected: undefined, sharpFocalPoint: undefined },
    { collectionFocalPoint: false, expected: { x: 10, y: 90 }, sharpFocalPoint: true },
    { collectionFocalPoint: undefined, expected: { x: 10, y: 90 }, sharpFocalPoint: undefined },
  ])(
    'should resolve the size focal point from Sharp ($sharpFocalPoint) over the collection ($collectionFocalPoint)',
    async ({ collectionFocalPoint, expected, sharpFocalPoint }) => {
      expect(
        await runPrepareUpload({
          collectionFocalPoint,
          sharpConfig: { focalPoint: sharpFocalPoint, variants },
        }),
      ).toEqual(expected)
    },
  )

  it.each([
    { expected: undefined, orientation: 6 },
    { expected: { x: 10, y: 90 }, orientation: undefined },
  ])(
    'should decide withoutEnlargement on the displayed size for EXIF orientation $orientation',
    async ({ expected, orientation }) => {
      // Stored 3000x2000; with orientation 6 it is displayed as 2000x3000, narrower than 2400,
      // so the size must take the plain `resize` path (which honors withoutEnlargement).
      expect(
        await runPrepareUpload({
          sharp: createSharpDependency({ height: 2000, orientation, width: 3000 }),
          sharpConfig: {
            variants: [{ name: 'full', width: 2400, withoutEnlargement: true }],
          },
        }),
      ).toEqual(expected)
    },
  )
})
