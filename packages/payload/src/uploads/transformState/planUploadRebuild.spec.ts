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

  it('should rebuild without a plan when the stored MIME type is unknown', async () => {
    const result = await plan({ next: rotate, previous: null, storedMimeType: undefined })

    expect(result).toEqual({ shouldRebuild: true })
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

  it('should rebuild a duplicate with no _transforms change', async () => {
    const result = await plan({ isDuplicating: true, next: null, previous: undefined })

    expect(result.shouldRebuild).toBe(true)
  })

  it('should rebuild for a crop sent in the uploadEdits query', async () => {
    const result = await plan({
      hasCropOrResizeEdit: true,
      isLegacyReupload: true,
      next: null,
      previous: null,
    })

    expect(result.shouldRebuild).toBe(true)
  })

  it('should not rebuild when only a custom key that no stage claims changed', async () => {
    const result = await plan({
      next: { watermark: 'draft' },
      previous: null,
      transformers: [makeStage('stage')],
    })

    expect(result.shouldRebuild).toBe(false)
  })

  it('should rebuild when a changed custom key is claimed by a stage that runs', async () => {
    const result = await plan({
      next: { watermark: 'draft' },
      previous: null,
      transformers: [makeStage('watermarker', ['watermark'])],
    })

    expect(result.shouldRebuild).toBe(true)
  })

  it('should not count a claim from a Sharp bridge that does not run', async () => {
    const result = await plan({
      next: { watermark: 'draft' },
      previous: null,
      transformers: [makeBridge('chosen', []), makeBridge('not-chosen', ['watermark'])],
    })

    expect(result.shouldRebuild).toBe(false)
  })

  it('should rebuild for a focal point write when a stage that runs claims focalPoint', async () => {
    const result = await plan({
      isLegacyReupload: true,
      next: null,
      previous: null,
      transformers: [makeStage('sharp', ['focalPoint'])],
    })

    expect(result.shouldRebuild).toBe(true)
  })

  it('should not rebuild or check coverage for a focal point write that no stage claims', async () => {
    const result = await plan({
      isLegacyReupload: true,
      next: { ...rotate, focalPoint: { x: 20, y: 80 } },
      previous: rotate,
      transformers: [makeStage('stage')],
    })

    expect(result.shouldRebuild).toBe(false)
  })
})
