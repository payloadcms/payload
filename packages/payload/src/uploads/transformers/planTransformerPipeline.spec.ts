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

const planUpload = (transformers: UploadTransformer[]) =>
  planTransformerPipeline({
    args: makeArgs({ operation: 'upload' }),
    capability: 'transformFile',
    transformers,
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

  it('should plan the transformers that accept and record the keys each one claims', async () => {
    const stage = (slug: string, canTransform?: UploadTransformer['canTransform']) =>
      makeTransformer({ slug, canTransform, transformFile: vi.fn() })
    const clipper = stage('clip', () => ({ canTransform: true, handledTransformKeys: ['clip'] }))
    const objectResult = stage('object', () => ({ canTransform: true }))
    const plain = stage('plain', () => true)
    const declined = stage('no', () => false)
    const declinedObject = stage('no-object', () => ({ canTransform: false }) as never)
    const transformers = [clipper, objectResult, declined, plain, declinedObject]

    const { claims, pipeline } = await planUpload(transformers)

    expect(pipeline).toEqual([clipper, objectResult, plain])
    expect(pipeline.map((transformer) => claims.get(transformer))).toEqual([['clip'], [], []])
    expect(claims.size).toBe(pipeline.length)
  })

  it.for([
    ['a string', 'clip'],
    ['an array with a non-string', ['clip', 1]],
    ['an empty string', ['']],
  ])(
    'should throw a TransformerContractError naming the transformer when handledTransformKeys is %s',
    async ([, handledTransformKeys]) => {
      const planning = planUpload([
        makeTransformer({
          canTransform: () => ({ canTransform: true, handledTransformKeys }) as never,
          slug: 'bad-claims',
          transformFile: vi.fn(),
        }),
      ])

      await expect(planning).rejects.toThrow(TransformerContractError)
      await expect(planning).rejects.toThrow('"bad-claims"')
    },
  )
})
