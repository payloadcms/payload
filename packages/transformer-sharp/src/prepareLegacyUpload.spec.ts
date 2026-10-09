import type { PayloadRequest, UploadEdits } from 'payload'
import type { UploadTransformTask } from 'payload/internal'

import { describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { getUploadTransformerInternal } from 'payload/internal'

import { createFileSource } from '../../payload/src/uploads/transformers/createFileSource.js'
import { sharpTransformer } from './sharpTransformer.js'

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
  it('should preserve shared variant configuration across uploads with different output formats', async () => {
    const input = await sharp({ create: { width: 64, height: 48, channels: 3, background: 'red' } })
      .jpeg()
      .toBuffer()
    const file = new File([input], 'source.jpg', { type: 'image/jpeg' })
    const sharedVariants = [{ name: 'card', width: 16, height: 12 }]
    const transformer = sharpTransformer({
      collections: {
        png: { formatOptions: { format: 'png' }, variants: sharedVariants },
        jpeg: { variants: sharedVariants },
      },
    })
    const req = makeReq({ focalPoint: false })
    const results = []

    for (const collectionSlug of ['png', 'jpeg']) {
      results.push(
        await getUploadTransformerInternal(transformer).prepareUpload({
          collectionSlug,
          doc: {},
          file,
          req,
          transform: async (task) => {
            const sourceFile = task.file ?? file
            const result = await transformer.transformFile({
              source: createFileSource({ file: sourceFile }),
              doc: {},
              originalDoc: {},
              options: task.options,
              req,
            })

            return result.file ?? sourceFile
          },
        }),
      )
    }

    expect(results[0].find(({ fieldPath }) => fieldPath === 'variants.card').file.type).toBe(
      'image/png',
    )
    expect(results[1].find(({ fieldPath }) => fieldPath === 'variants.card').file.type).toBe(
      'image/jpeg',
    )
    expect(sharedVariants).toEqual([{ name: 'card', width: 16, height: 12 }])
  })

  it.each([false, true])(
    'should encode variants once while preserving main geometry (resize: %s)',
    async (shouldResizeMain) => {
      const pixels = Buffer.from(
        Array.from(
          { length: 64 * 48 * 3 },
          (_, index) => (index * 73 + Math.floor(index / 7)) % 256,
        ),
      )
      const input = await sharp(pixels, { raw: { width: 64, height: 48, channels: 3 } })
        .webp()
        .toBuffer()
      const file = new File([input], 'source.webp', { type: 'image/webp' })
      const resizeOptions = shouldResizeMain
        ? { width: 40, height: 30, fit: 'fill' as const }
        : undefined
      const transformer = sharpTransformer({
        collections: {
          media: { resizeOptions, variants: [{ name: 'card', width: 16, height: 12 }] },
        },
      })
      const req = makeReq({ focalPoint: false })
      const results = await getUploadTransformerInternal(transformer).prepareUpload({
        collectionSlug: 'media',
        doc: {},
        file,
        req,
        transform: async (task) => {
          const sourceFile = task.file ?? file
          const result = await transformer.transformFile({
            source: createFileSource({ file: sourceFile }),
            doc: {},
            originalDoc: {},
            options: task.options,
            req,
          })
          return result.file ?? sourceFile
        },
      })
      const variant = results.find(({ fieldPath }) => fieldPath === 'variants.card').file
      const variantSource = shouldResizeMain
        ? await sharp(input).rotate().resize(resizeOptions).webp({ lossless: true }).toBuffer()
        : input
      const expected = await sharp(variantSource, { animated: true })
        .rotate()
        .resize({ width: 16, height: 12 })
        .webp()
        .toBuffer()
      expect(Buffer.from(await variant.arrayBuffer())).toEqual(expected)
      expect(await sharp(Buffer.from(await variant.arrayBuffer())).metadata()).toMatchObject({
        width: 16,
        height: 12,
        format: 'webp',
      })
    },
  )

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
