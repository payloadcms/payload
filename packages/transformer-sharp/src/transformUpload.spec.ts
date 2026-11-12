import type { PayloadRequest } from 'payload'
import type { UploadTransformTask } from 'payload/internal'

import { describe, expect, it, vi } from 'vitest'

import type { SharpCollectionConfig, SharpDependency, SharpUploadTaskOptions } from './types.js'

import { createTransformUpload } from './transformUpload.js'

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

  await createTransformUpload({ collections: { media: sharpConfig }, sharpDependency })({
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
})
