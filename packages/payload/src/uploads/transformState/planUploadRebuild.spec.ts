import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from '../transformers/types.js'

import { ValidationError } from '../../errors/ValidationError.js'
import { uploadTransformerInternal } from '../transformers/uploadTransformerBridge.js'
import { planUploadRebuild } from './planUploadRebuild.js'

const makeStage = (slug: string, handledTransformKeys?: string[]): UploadTransformer => ({
  slug,
  canTransform: vi.fn(() =>
    handledTransformKeys ? { canTransform: true as const, handledTransformKeys } : true,
  ),
  mimeTypes: ['text/*'],
  transformFile: vi.fn(),
})

const makeBridge = (slug: string, handledTransformKeys: string[]): UploadTransformer => ({
  ...makeStage(slug, handledTransformKeys),
  [uploadTransformerInternal]: { prepareUpload: vi.fn() },
})

const plan = ({
  next,
  previous,
  transformers = [],
  ...overrides
}: {
  next: null | Record<string, unknown>
  previous: null | Record<string, unknown> | undefined
  transformers?: UploadTransformer[]
} & Partial<Parameters<typeof planUploadRebuild>[0]>) =>
  planUploadRebuild({
    collectionSlug: 'media',
    hasCropOrResizeEdit: false,
    isDuplicating: false,
    isExternalSource: false,
    isLegacyReupload: false,
    pipelineDoc: { _transforms: next },
    pipelineOriginalDoc: Object.freeze({ _transforms: next }),
    previousTransforms: previous,
    req: {
      payload: { config: { upload: { transformers } } },
      t: vi.fn((key: string) => key),
    } as unknown as PayloadRequest,
    storedMimeType: 'text/markdown',
    ...overrides,
  })

const rotate = { rotate: { angle: 90 } }

describe('planUploadRebuild', () => {
  it('should rebuild an external source without planning', async () => {
    const stage = makeStage('stage')

    const result = await plan({
      isExternalSource: true,
      next: null,
      previous: null,
      transformers: [stage],
    })

    expect(result).toEqual({ shouldRebuild: true })
    expect(stage.canTransform).not.toHaveBeenCalled()
  })

  it('should not rebuild when _transforms did not change and there is no other trigger', async () => {
    const stage = makeStage('stage')

    const result = await plan({ next: rotate, previous: rotate, transformers: [stage] })

    expect(result).toEqual({ shouldRebuild: false })
    expect(stage.canTransform).not.toHaveBeenCalled()
  })

  it('should rebuild when a built-in key changes and a stage claims it', async () => {
    const result = await plan({
      next: rotate,
      previous: null,
      transformers: [makeStage('rotator', ['rotate'])],
    })

    expect(result.shouldRebuild).toBe(true)
    expect(result.rebuildPlan?.mimeType).toBe('text/markdown')
  })

  it('should reject a changed built-in key that no stage claims', async () => {
    const result = plan({ next: rotate, previous: null, transformers: [makeStage('stage')] })

    await expect(result).rejects.toThrow(ValidationError)
    await expect(result).rejects.toMatchObject({
      data: { errors: [{ path: '_transforms.rotate' }] },
    })
  })

  it('should rebuild without a plan when the stored MIME type is unknown', async () => {
    const result = await plan({ next: rotate, previous: null, storedMimeType: undefined })

    expect(result).toEqual({ shouldRebuild: true })
  })

  it.for<{ args: Parameters<typeof plan>[0]; name: string; shouldRebuild: boolean }>([
    {
      name: 'rebuild a duplicate with no _transforms change',
      args: { isDuplicating: true, next: null, previous: undefined },
      shouldRebuild: true,
    },
    {
      name: 'rebuild for a crop sent in the uploadEdits query',
      args: { hasCropOrResizeEdit: true, isLegacyReupload: true, next: null, previous: null },
      shouldRebuild: true,
    },
    {
      name: 'not rebuild when only a custom key that no stage claims changed',
      args: { next: { watermark: 'draft' }, previous: null, transformers: [makeStage('stage')] },
      shouldRebuild: false,
    },
    {
      name: 'rebuild when a changed custom key is claimed by a stage that runs',
      args: {
        next: { watermark: 'draft' },
        previous: null,
        transformers: [makeStage('watermarker', ['watermark'])],
      },
      shouldRebuild: true,
    },
    {
      name: 'not count a claim from a Sharp bridge that does not run',
      args: {
        next: { watermark: 'draft' },
        previous: null,
        transformers: [makeBridge('chosen', []), makeBridge('not-chosen', ['watermark'])],
      },
      shouldRebuild: false,
    },
    {
      name: 'rebuild for a focal point write when a stage that runs claims focalPoint',
      args: {
        isLegacyReupload: true,
        next: null,
        previous: null,
        transformers: [makeStage('sharp', ['focalPoint'])],
      },
      shouldRebuild: true,
    },
    {
      name: 'not rebuild or check coverage for a focal point write that no stage claims',
      args: {
        isLegacyReupload: true,
        next: { ...rotate, focalPoint: { x: 20, y: 80 } },
        previous: rotate,
        transformers: [makeStage('stage')],
      },
      shouldRebuild: false,
    },
  ])('should $name', async ({ args, shouldRebuild }) => {
    expect((await plan(args)).shouldRebuild).toBe(shouldRebuild)
  })
})
