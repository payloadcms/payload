import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from '../transformers/types.js'

import { uploadTransformerInternal } from '../transformers/uploadTransformerBridge.js'
import { planUploadPipeline, planUploadRebuild } from './planUpload.js'

const stage = (handledTransformKeys?: string[], isBridge = false): UploadTransformer => ({
  slug: 'stage',
  canTransform: () => (handledTransformKeys ? { canTransform: true, handledTransformKeys } : true),
  mimeTypes: ['text/*'],
  transformFile: vi.fn(),
  ...(isBridge ? { [uploadTransformerInternal]: { transformUpload: vi.fn() } } : {}),
})

const rotate = { rotate: { angle: 90 } }
const watermark = { watermark: 'draft' }

describe('planUploadRebuild', () => {
  it.for([
    {
      name: 'rebuild an external source without planning',
      args: { isExternalSource: true, previousTransforms: null },
      expected: { hasPlan: false, outcome: 'rebuild' },
    },
    {
      name: 'not rebuild or plan when _transforms did not change',
      args: { previousTransforms: structuredClone(rotate) },
      expected: { hasPlan: false, outcome: 'keep' },
      next: rotate,
    },
    {
      name: 'rebuild without a plan when the stored MIME type is unknown',
      args: { previousTransforms: null, storedMimeType: undefined },
      expected: { hasPlan: false, outcome: 'rebuild' },
      next: rotate,
    },
    {
      name: 'rebuild with a plan when a built-in key is removed',
      args: { previousTransforms: rotate },
      expected: { hasPlan: true, outcome: 'rebuild' },
    },
    {
      name: 'rebuild a duplicate with no _transforms change',
      args: { isDuplicating: true },
      expected: { hasPlan: true, outcome: 'rebuild' },
    },
    {
      name: 'rebuild for a crop sent in the uploadEdits query',
      args: { hasCropOrResizeEdit: true, hasCropOrFocalPointEdit: true, previousTransforms: null },
      expected: { hasPlan: true, outcome: 'rebuild' },
    },
    {
      name: 'not rebuild when a changed custom key has no claim',
      args: { previousTransforms: null },
      expected: { hasPlan: true, outcome: 'keep' },
      next: watermark,
      transformers: [stage()],
    },
    {
      name: 'rebuild when a stage that runs claims a changed custom key',
      args: { previousTransforms: null },
      expected: { hasPlan: true, outcome: 'rebuild' },
      next: watermark,
      transformers: [stage(['watermark'])],
    },
    {
      name: 'not count a claim from a Sharp bridge that does not run',
      args: { previousTransforms: null },
      expected: { hasPlan: true, outcome: 'keep' },
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

    expect({ hasPlan: Boolean(result.rebuildPlan), outcome: result.outcome }).toEqual(expected)
  })
})

describe('planUploadPipeline', () => {
  const crop = { height: 20, width: 30, x: 0, y: 0 }

  const variantsOwner: UploadTransformer = {
    slug: 'owner',
    canTransform: ({ operation, purpose }) =>
      operation === 'request' && purpose === 'persisted-default'
        ? { canTransform: true, handledTransformKeys: ['crop'] }
        : false,
    handleRequest: vi.fn(),
    mimeTypes: ['image/png'],
  }

  const sharpBridge = ({ isOwnCollection }: { isOwnCollection: boolean }): UploadTransformer => ({
    slug: 'sharp',
    canTransform: () => ({ canTransform: true, handledTransformKeys: ['crop'] }),
    mimeTypes: ['image/*'],
    transformFile: vi.fn(),
    [uploadTransformerInternal]: {
      handlesCollection: () => isOwnCollection,
      transformUpload: vi.fn(),
    },
  })

  it.for([
    {
      name: 'drop a bridge that does not own the collection when the variants owner builds at request',
      expected: [],
    },
    {
      name: 'keep the bridge when the variants owner cannot build this MIME type at request',
      expected: ['sharp'],
      mimeType: 'image/jpeg',
    },
    {
      name: 'keep the bridge when no original would be stored',
      canApplyAtRequest: false,
      expected: ['sharp'],
    },
    {
      name: 'keep a bridge that owns the collection',
      expected: ['sharp'],
      isOwnCollection: true,
    },
    {
      name: 'keep the bridge when it registered the variants',
      expected: ['sharp'],
      variantsTransformerSlug: 'sharp',
    },
    {
      name: 'keep the bridge when the collection has no variants',
      expected: ['sharp'],
      variants: [],
    },
  ])(
    'should $name',
    async ({
      canApplyAtRequest = true,
      expected,
      isOwnCollection = false,
      mimeType = 'image/png',
      variants = [{ name: 'card' }],
      variantsTransformerSlug = 'owner',
    }) => {
      const doc = { _transforms: { crop } }

      const plan = await planUploadPipeline({
        canApplyAtRequest,
        collectionSlug: 'media',
        mimeType,
        pipelineDoc: doc,
        pipelineOriginalDoc: Object.freeze(doc),
        req: {
          payload: {
            collections: { media: { config: { upload: { variants, variantsTransformerSlug } } } },
            config: {
              upload: { transformers: [sharpBridge({ isOwnCollection }), variantsOwner] },
            },
          },
        } as unknown as PayloadRequest,
      })

      expect({
        claims: [...plan.claims.keys()].map(({ slug }) => slug),
        pipeline: plan.pipeline.map(({ slug }) => slug),
      }).toEqual({ claims: expected, pipeline: expected })
    },
  )
})
