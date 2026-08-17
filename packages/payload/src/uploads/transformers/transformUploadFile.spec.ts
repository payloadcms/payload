import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from './types.js'

import { transformUploadFile } from './transformUploadFile.js'

const makeReq = (): PayloadRequest => ({}) as unknown as PayloadRequest

const makeTransformer = (overrides: Partial<UploadTransformer> = {}): UploadTransformer => ({
  mimeTypes: ['image/*'],
  slug: 'test-transformer',
  ...overrides,
})

describe('transformUploadFile', () => {
  it('should return the original file unchanged when the pipeline is empty', async () => {
    const file = new File(['bytes'], 'logo.png')

    const result = await transformUploadFile({
      collectionSlug: 'media',
      file,
      options: undefined,
      pipeline: [],
      req: makeReq(),
    })

    expect(result).toBe(file)
  })

  it('should call every eligible transformFile in declaration order with the given collectionSlug, options, and request', async () => {
    const order: string[] = []
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn().mockImplementation(async (args) => {
        order.push('first')
        expect(args).toMatchObject({ collectionSlug: 'media', options: 'my-options' })
        return { status: 'continue' }
      }),
    })
    const second = makeTransformer({
      slug: 'second',
      transformFile: vi.fn().mockImplementation(async () => {
        order.push('second')
        return { status: 'continue' }
      }),
    })

    await transformUploadFile({
      collectionSlug: 'media',
      file: new File(['bytes'], 'logo.png'),
      options: 'my-options',
      pipeline: [first, second],
      req: makeReq(),
    })

    expect(order).toEqual(['first', 'second'])
  })

  it('should skip a pipeline entry without a transformFile function', async () => {
    const withoutTransformFile = makeTransformer({ slug: 'no-transform-file' })
    const withTransformFile = makeTransformer({
      slug: 'has-transform-file',
      transformFile: vi.fn().mockResolvedValue({ status: 'continue' }),
    })

    await transformUploadFile({
      collectionSlug: 'media',
      file: new File(['bytes'], 'logo.png'),
      options: undefined,
      pipeline: [withoutTransformFile, withTransformFile],
      req: makeReq(),
    })

    expect(withTransformFile.transformFile).toHaveBeenCalledTimes(1)
  })

  it('should preserve the same File reference when a stage returns continue without a file', async () => {
    const file = new File(['bytes'], 'logo.png')
    const transformer = makeTransformer({
      transformFile: vi.fn().mockResolvedValue({ status: 'continue' }),
    })

    const result = await transformUploadFile({
      collectionSlug: 'media',
      file,
      options: undefined,
      pipeline: [transformer],
      req: makeReq(),
    })

    expect(result).toBe(file)
  })

  it('should replace the accumulator when a stage returns continue with a file, and pass it to the next stage', async () => {
    const replacement = new File(['replaced'], 'logo.png')
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn().mockResolvedValue({ file: replacement, status: 'continue' }),
    })
    const second = makeTransformer({
      slug: 'second',
      transformFile: vi.fn().mockImplementation(async ({ file }) => {
        expect(file).toBe(replacement)
        return { status: 'continue' }
      }),
    })

    const result = await transformUploadFile({
      collectionSlug: 'media',
      file: new File(['original'], 'logo.png'),
      options: undefined,
      pipeline: [first, second],
      req: makeReq(),
    })

    expect(result).toBe(replacement)
  })

  it('should replace the accumulator and stop the pipeline when a stage returns complete', async () => {
    const completeFile = new File(['done'], 'logo.png')
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn().mockResolvedValue({ file: completeFile, status: 'complete' }),
    })
    const second = makeTransformer({
      slug: 'second',
      transformFile: vi.fn(),
    })

    const result = await transformUploadFile({
      collectionSlug: 'media',
      file: new File(['original'], 'logo.png'),
      options: undefined,
      pipeline: [first, second],
      req: makeReq(),
    })

    expect(result).toBe(completeFile)
    expect(second.transformFile).not.toHaveBeenCalled()
  })

  it('should propagate a thrown error immediately, without calling later stages', async () => {
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn().mockRejectedValue(new Error('transform failed')),
    })
    const second = makeTransformer({ slug: 'second', transformFile: vi.fn() })

    await expect(
      transformUploadFile({
        collectionSlug: 'media',
        file: new File(['original'], 'logo.png'),
        options: undefined,
        pipeline: [first, second],
        req: makeReq(),
      }),
    ).rejects.toThrow('transform failed')

    expect(second.transformFile).not.toHaveBeenCalled()
  })
})
