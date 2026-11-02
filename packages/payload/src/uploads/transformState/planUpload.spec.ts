import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from '../transformers/types.js'

import { uploadTransformerInternal } from '../transformers/uploadTransformerBridge.js'
import { planUploadRebuild } from './planUpload.js'

const stage = (handledTransformKeys?: string[], isBridge = false): UploadTransformer => ({
  slug: 'stage',
  canTransform: () => (handledTransformKeys ? { canTransform: true, handledTransformKeys } : true),
  mimeTypes: ['text/*'],
  transformFile: vi.fn(),
  ...(isBridge ? { [uploadTransformerInternal]: { prepareUpload: vi.fn() } } : {}),
})

const rotate = { rotate: { angle: 90 } }
const watermark = { watermark: 'draft' }

describe('planUploadRebuild', () => {
  it.for([
    {
      name: 'rebuild an external source without planning',
      args: { isExternalSource: true, previousTransforms: null },
      expected: { hasPlan: false, shouldRebuild: true },
    },
    {
      name: 'not rebuild or plan when _transforms did not change',
      args: { previousTransforms: structuredClone(rotate) },
      expected: { hasPlan: false, shouldRebuild: false },
      next: rotate,
    },
    {
      name: 'rebuild without a plan when the stored MIME type is unknown',
      args: { previousTransforms: null, storedMimeType: undefined },
      expected: { hasPlan: false, shouldRebuild: true },
      next: rotate,
    },
    {
      name: 'rebuild with a plan when a built-in key is removed',
      args: { previousTransforms: rotate },
      expected: { hasPlan: true, shouldRebuild: true },
    },
    {
      name: 'rebuild a duplicate with no _transforms change',
      args: { isDuplicating: true },
      expected: { hasPlan: true, shouldRebuild: true },
    },
    {
      name: 'rebuild for a crop sent in the uploadEdits query',
      args: { hasCropOrResizeEdit: true, hasCropOrFocalPointEdit: true, previousTransforms: null },
      expected: { hasPlan: true, shouldRebuild: true },
    },
    {
      name: 'not rebuild when a changed custom key has no claim',
      args: { previousTransforms: null },
      expected: { hasPlan: true, shouldRebuild: false },
      next: watermark,
      transformers: [stage()],
    },
    {
      name: 'rebuild when a stage that runs claims a changed custom key',
      args: { previousTransforms: null },
      expected: { hasPlan: true, shouldRebuild: true },
      next: watermark,
      transformers: [stage(['watermark'])],
    },
    {
      name: 'not count a claim from a Sharp bridge that does not run',
      args: { previousTransforms: null },
      expected: { hasPlan: true, shouldRebuild: false },
      next: watermark,
      transformers: [stage([], true), stage(['watermark'], true)],
    },
  ])('should $name', async ({ args, expected, next = null, transformers = [] }) => {
    const result = await planUploadRebuild({
      canApplyAtRequest: false,
      collectionSlug: 'media',
      hasCropOrResizeEdit: false,
      isDuplicating: false,
      isExternalSource: false,
      hasCropOrFocalPointEdit: false,
      pipelineDoc: { _transforms: next },
      pipelineOriginalDoc: Object.freeze({ _transforms: next }),
      previousTransforms: undefined,
      req: { payload: { config: { upload: { transformers } } } } as unknown as PayloadRequest,
      storedMimeType: 'text/markdown',
      ...args,
    })

    expect({ hasPlan: Boolean(result.rebuildPlan), shouldRebuild: result.shouldRebuild }).toEqual(
      expected,
    )
  })
})
