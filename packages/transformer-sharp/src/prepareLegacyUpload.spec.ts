import type { PayloadRequest, UploadEdits } from 'payload'
import type { UploadTransformTask } from 'payload/internal'

import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

import type { SharpCollectionConfig, SharpDependency, SharpUploadTaskOptions } from './types.js'

import { createPrepareLegacyUpload } from './prepareLegacyUpload.js'
import { createTransformFile } from './transformFile.js'

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
})

describe('createPrepareLegacyUpload with EXIF-rotated images', () => {
  // Stored as 3000x2000 with EXIF orientation 6, so it displays as a 2000x3000 portrait.
  const prepareRotatedUpload = async () => {
    const file = new File(
      [
        await sharp({ create: { background: '#888', channels: 3, height: 2000, width: 3000 } })
          .jpeg()
          .withMetadata({ orientation: 6 })
          .toBuffer(),
      ],
      'photo.jpg',
      { type: 'image/jpeg' },
    )
    const transformFile = createTransformFile({ sharpDependency: sharp })
    const sizeTasks: SharpUploadTaskOptions[] = []

    const results = await createPrepareLegacyUpload({
      collections: {
        media: { variants: [{ name: 'full', width: 2400, withoutEnlargement: true }] },
      },
      sharpDependency: sharp,
    })({
      collectionSlug: 'media',
      file,
      req: makeReq({}),
      transform: async (task) => {
        const options = task.options as SharpUploadTaskOptions
        if (options.kind === 'size') {
          sizeTasks.push(options)
        }
        const source = task.file ?? file
        const result = await transformFile({ file: source, options, req: makeReq({}) })
        return result.file ?? source
      },
      uploadEdits: { focalPoint: { x: 50, y: 50 } } as UploadEdits,
    })

    return { results, sizeTasks }
  }

  it('should use the displayed dimensions to pick the resize action', async () => {
    const { sizeTasks } = await prepareRotatedUpload()

    // 2000px displayed width is below the 2400 target, so `withoutEnlargement` applies
    // and the focal-point crop (which ignores it) must not be used.
    expect(sizeTasks).toHaveLength(1)
    expect(sizeTasks[0]?.kind === 'size' && sizeTasks[0].focalPoint).toBeUndefined()
  })

  it('should not enlarge a rotated image past its displayed size', async () => {
    const { results } = await prepareRotatedUpload()
    const full = results.find((result) => result.fieldPath === 'variants.full')
    const metadata = await sharp(Buffer.from(await full!.file!.arrayBuffer())).metadata()

    expect({ height: metadata.height, width: metadata.width }).toEqual({
      height: 3000,
      width: 2000,
    })
  })
})
