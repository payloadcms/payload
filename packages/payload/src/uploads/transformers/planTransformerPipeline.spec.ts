import { describe, expect, it, vi } from 'vitest'

import type { CanTransformArgs, UploadTransformer } from './types.js'

import { planTransformerPipeline } from './planTransformerPipeline.js'

const makeArgs = (overrides: Partial<CanTransformArgs> = {}): CanTransformArgs => ({
  collectionSlug: 'media',
  mimeType: 'image/png',
  operation: 'request',
  req: {} as CanTransformArgs['req'],
  ...overrides,
})

const makeTransformer = (overrides: Partial<UploadTransformer> = {}): UploadTransformer => ({
  mimeTypes: ['image/*'],
  slug: 'test-transformer',
  ...overrides,
})

describe('planTransformerPipeline', () => {
  it('should only include transformers that implement the requested capability', async () => {
    const requestOnly = makeTransformer({ handleRequest: vi.fn(), slug: 'request-only' })
    const fileOnly = makeTransformer({ slug: 'file-only', transformFile: vi.fn() })
    const transformers = [requestOnly, fileOnly]

    const requestPipeline = await planTransformerPipeline({
      args: makeArgs(),
      capability: 'handleRequest',
      transformers,
    })
    const filePipeline = await planTransformerPipeline({
      args: makeArgs({ operation: 'upload' }),
      capability: 'transformFile',
      transformers,
    })

    expect(requestPipeline).toEqual([requestOnly])
    expect(filePipeline).toEqual([fileOnly])
  })

  it('should check the MIME type before calling canTransform', async () => {
    const canTransform = vi.fn().mockResolvedValue(true)
    const transformer = makeTransformer({
      canTransform,
      handleRequest: vi.fn(),
      mimeTypes: ['video/*'],
    })

    const pipeline = await planTransformerPipeline({
      args: makeArgs({ mimeType: 'image/png' }),
      capability: 'handleRequest',
      transformers: [transformer],
    })

    expect(pipeline).toEqual([])
    expect(canTransform).not.toHaveBeenCalled()
  })

  it('should reject planning without evaluating later transformers when canTransform throws', async () => {
    const thirdCanTransform = vi.fn().mockResolvedValue(true)
    const first = makeTransformer({ handleRequest: vi.fn(), slug: 'first' })
    const second = makeTransformer({
      canTransform: vi.fn().mockRejectedValue(new Error('boom')),
      handleRequest: vi.fn(),
      slug: 'second',
    })
    const third = makeTransformer({
      canTransform: thirdCanTransform,
      handleRequest: vi.fn(),
      slug: 'third',
    })

    await expect(
      planTransformerPipeline({
        args: makeArgs(),
        capability: 'handleRequest',
        transformers: [first, second, third],
      }),
    ).rejects.toThrow('boom')

    expect(thirdCanTransform).not.toHaveBeenCalled()
  })
})
