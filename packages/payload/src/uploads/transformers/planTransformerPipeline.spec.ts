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
  it('should skip transformers without handleRequest when planning the handleRequest capability', async () => {
    const transformer = makeTransformer({ handleRequest: undefined, transformFile: vi.fn() })

    const pipeline = await planTransformerPipeline({
      args: makeArgs(),
      capability: 'handleRequest',
      transformers: [transformer],
    })

    expect(pipeline).toEqual([])
  })

  it('should skip transformers without transformFile when planning the transformFile capability', async () => {
    const transformer = makeTransformer({ handleRequest: vi.fn(), transformFile: undefined })

    const pipeline = await planTransformerPipeline({
      args: makeArgs({ operation: 'upload' }),
      capability: 'transformFile',
      transformers: [transformer],
    })

    expect(pipeline).toEqual([])
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

  it('should pass collection slug, document ID, MIME type, operation, and request to canTransform', async () => {
    const canTransform = vi.fn().mockResolvedValue(true)
    const transformer = makeTransformer({ canTransform, handleRequest: vi.fn() })
    const args = makeArgs({ collectionSlug: 'media', documentID: '123', mimeType: 'image/png' })

    await planTransformerPipeline({
      args,
      capability: 'handleRequest',
      transformers: [transformer],
    })

    expect(canTransform).toHaveBeenCalledWith(args)
  })

  it('should treat a missing canTransform as eligible', async () => {
    const transformer = makeTransformer({ handleRequest: vi.fn() })

    const pipeline = await planTransformerPipeline({
      args: makeArgs(),
      capability: 'handleRequest',
      transformers: [transformer],
    })

    expect(pipeline).toEqual([transformer])
  })

  it('should include every eligible transformer in declaration order', async () => {
    const first = makeTransformer({ handleRequest: vi.fn(), slug: 'first' })
    const second = makeTransformer({ handleRequest: vi.fn(), slug: 'second' })
    const third = makeTransformer({ handleRequest: vi.fn(), slug: 'third' })

    const pipeline = await planTransformerPipeline({
      args: makeArgs(),
      capability: 'handleRequest',
      transformers: [first, second, third],
    })

    expect(pipeline).toEqual([first, second, third])
  })

  it('should not stop evaluating later transformers when an earlier canTransform returns false', async () => {
    const secondCanTransform = vi.fn().mockResolvedValue(true)
    const first = makeTransformer({
      canTransform: vi.fn().mockResolvedValue(false),
      handleRequest: vi.fn(),
      slug: 'first',
    })
    const second = makeTransformer({
      canTransform: secondCanTransform,
      handleRequest: vi.fn(),
      slug: 'second',
    })

    const pipeline = await planTransformerPipeline({
      args: makeArgs(),
      capability: 'handleRequest',
      transformers: [first, second],
    })

    expect(pipeline).toEqual([second])
    expect(secondCanTransform).toHaveBeenCalledTimes(1)
  })

  it('should abort planning and reject when canTransform throws, rather than treating it as false', async () => {
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

  it('should never call handleRequest or transformFile while planning', async () => {
    const handleRequest = vi.fn()
    const transformFile = vi.fn()
    const transformer = makeTransformer({ handleRequest, transformFile })

    await planTransformerPipeline({
      args: makeArgs(),
      capability: 'handleRequest',
      transformers: [transformer],
    })

    expect(handleRequest).not.toHaveBeenCalled()
    expect(transformFile).not.toHaveBeenCalled()
  })

  it('should return an empty array for an empty transformers list', async () => {
    const pipeline = await planTransformerPipeline({
      args: makeArgs(),
      capability: 'handleRequest',
      transformers: [],
    })

    expect(pipeline).toEqual([])
  })
})
