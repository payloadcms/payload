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
  it('should replace the file and pass it to the next stage when a stage returns continue with a file', async () => {
    const replacement = new File(['replaced'], 'logo.png')
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn().mockResolvedValue({ file: replacement, status: 'continue' }),
    })
    const second = makeTransformer({
      slug: 'second',
      transformFile: vi.fn().mockResolvedValue({ status: 'continue' }),
    })

    const result = await transformUploadFile({
      collectionSlug: 'media',
      file: new File(['original'], 'logo.png'),
      options: undefined,
      pipeline: [first, second],
      req: makeReq(),
    })

    expect(second.transformFile).toHaveBeenCalledWith(
      expect.objectContaining({ file: replacement }),
    )
    expect(result).toBe(replacement)
  })

  it('should replace the file and stop the pipeline when a stage returns complete', async () => {
    const completeFile = new File(['done'], 'logo.png')
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn().mockResolvedValue({ file: completeFile, status: 'complete' }),
    })
    const second = makeTransformer({ slug: 'second', transformFile: vi.fn() })

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

  it('should propagate a thrown error without calling later stages', async () => {
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
