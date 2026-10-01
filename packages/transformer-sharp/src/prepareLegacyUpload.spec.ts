import type { PayloadRequest, UploadEdits } from 'payload'
import type { UploadTransformTask } from 'payload/internal'

import { describe, expect, it, vi } from 'vitest'

import type { SharpCollectionConfig, SharpDependency, SharpUploadTaskOptions } from './types.js'

import { createPrepareLegacyUpload } from './prepareLegacyUpload.js'

const sharpDependency = (() => ({
  metadata: async () => ({ height: 1000, width: 1000 }),
})) as unknown as SharpDependency

const makeReq = ({ focalPoint }: { focalPoint?: boolean }): PayloadRequest =>
  ({
    payload: { collections: { media: { config: { upload: { focalPoint } } } } },
  }) as unknown as PayloadRequest

const runPrepareUpload = async ({
  collectionFocalPoint,
  sharpConfig,
}: {
  collectionFocalPoint?: boolean
  sharpConfig: SharpCollectionConfig
}) => {
  const transform = vi.fn(
    async (_task: UploadTransformTask) => new File(['x'], 'image.png', { type: 'image/png' }),
  )

  await createPrepareLegacyUpload({ collections: { media: sharpConfig }, sharpDependency })({
    collectionSlug: 'media',
    file: new File(['x'], 'image.png', { type: 'image/png' }),
    req: makeReq({ focalPoint: collectionFocalPoint }),
    transform,
    uploadEdits: { focalPoint: { x: 10, y: 90 } } as UploadEdits,
  })

  const sizeTask = transform.mock.calls
    .map(([task]) => task.options as SharpUploadTaskOptions)
    .find((options) => options.kind === 'size')

  return sizeTask?.kind === 'size' ? sizeTask.focalPoint : undefined
}

const variants = [{ name: 'card', height: 200, width: 400 }]

describe('createPrepareLegacyUpload', () => {
  it('should not apply the focal point when Sharp leaves it unset and the collection sets focalPoint: false', async () => {
    expect(
      await runPrepareUpload({ collectionFocalPoint: false, sharpConfig: { variants } }),
    ).toBeUndefined()
  })

  it("should let Sharp's focalPoint override the collection's", async () => {
    expect(
      await runPrepareUpload({
        collectionFocalPoint: false,
        sharpConfig: { focalPoint: true, variants },
      }),
    ).toEqual({ x: 10, y: 90 })
  })

  it('should apply the focal point when neither Sharp nor the collection disables it', async () => {
    expect(await runPrepareUpload({ sharpConfig: { variants } })).toEqual({ x: 10, y: 90 })
  })
})
