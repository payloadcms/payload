import { describe, expect, it, vi } from 'vitest'

import type { CanTransformArgs, UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
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

    const { pipeline: requestPipeline } = await planTransformerPipeline({
      args: makeArgs(),
      capability: 'handleRequest',
      transformers,
    })
    const { pipeline: filePipeline } = await planTransformerPipeline({
      args: makeArgs({ operation: 'upload' }),
      capability: 'transformFile',
      transformers,
    })

    expect(requestPipeline).toEqual([requestOnly])
    expect(filePipeline).toEqual([fileOnly])
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

  it('should include a transformer whose canTransform returns an object result', async () => {
    const transformer = makeTransformer({
      canTransform: () => ({ canTransform: true }),
      handleRequest: vi.fn(),
    })

    const { claims, pipeline } = await planTransformerPipeline({
      args: makeArgs(),
      capability: 'handleRequest',
      transformers: [transformer],
    })

    expect(pipeline).toEqual([transformer])
    expect(claims.get(transformer)).toEqual([])
  })

  it('should exclude a transformer whose object result is not canTransform: true', async () => {
    const transformer = makeTransformer({
      canTransform: () => ({ canTransform: false }) as never,
      transformFile: vi.fn(),
    })

    const { pipeline } = await planTransformerPipeline({
      args: makeArgs({ operation: 'upload' }),
      capability: 'transformFile',
      transformers: [transformer],
    })

    expect(pipeline).toEqual([])
  })

  it('should record the keys each planned transformer claims', async () => {
    const clipper = makeTransformer({
      canTransform: () => ({ canTransform: true, handledTransformKeys: ['clip', 'posterFrame'] }),
      slug: 'clipper',
      transformFile: vi.fn(),
    })
    const plain = makeTransformer({
      canTransform: () => true,
      slug: 'plain',
      transformFile: vi.fn(),
    })
    const noPredicate = makeTransformer({ slug: 'no-predicate', transformFile: vi.fn() })

    const { claims, pipeline } = await planTransformerPipeline({
      args: makeArgs({ operation: 'upload' }),
      capability: 'transformFile',
      transformers: [clipper, plain, noPredicate],
    })

    expect(pipeline).toEqual([clipper, plain, noPredicate])
    expect(claims.get(clipper)).toEqual(['clip', 'posterFrame'])
    expect(claims.get(plain)).toEqual([])
    expect(claims.get(noPredicate)).toEqual([])
  })

  it('should not record claims for a transformer that is not planned', async () => {
    const declined = makeTransformer({
      canTransform: () => false,
      transformFile: vi.fn(),
    })

    const { claims } = await planTransformerPipeline({
      args: makeArgs({ operation: 'upload' }),
      capability: 'transformFile',
      transformers: [declined],
    })

    expect(claims.has(declined)).toBe(false)
  })

  it.each([
    ['a string', 'clip'],
    ['an array with a non-string', ['clip', 1]],
    ['an array with an empty string', ['']],
  ])(
    'should throw a TransformerContractError naming the transformer when handledTransformKeys is %s',
    async (_label, handledTransformKeys) => {
      const transformer = makeTransformer({
        canTransform: () => ({ canTransform: true, handledTransformKeys }) as never,
        slug: 'bad-claims',
        transformFile: vi.fn(),
      })

      const planning = planTransformerPipeline({
        args: makeArgs({ operation: 'upload' }),
        capability: 'transformFile',
        transformers: [transformer],
      })

      await expect(planning).rejects.toThrow(TransformerContractError)
      await expect(planning).rejects.toThrow('"bad-claims"')
    },
  )
})
