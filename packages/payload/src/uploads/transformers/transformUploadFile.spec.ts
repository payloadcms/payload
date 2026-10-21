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
      pipeline: [{ transformer: first }, { transformer: second }],
      req: makeReq(),
    })

    expect(second.transformFile).toHaveBeenCalledWith(
      expect.objectContaining({ source: expect.objectContaining({ filename: replacement.name }) }),
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
      pipeline: [{ transformer: first }, { transformer: second }],
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
        pipeline: [{ transformer: first }, { transformer: second }],
        req: makeReq(),
      }),
    ).rejects.toThrow('transform failed')

    expect(second.transformFile).not.toHaveBeenCalled()
  })
})

describe('document-aware stages', () => {
  it('should route a later stage using the replacement MIME type', async () => {
    const jpegStage = makeTransformer({
      slug: 'jpeg',
      mimeTypes: ['image/jpeg'],
      canTransform: vi.fn().mockReturnValue({ canTransform: true, options: 'jpeg-options' }),
      transformFile: vi.fn().mockResolvedValue({ status: 'continue' }),
    })
    const convert = makeTransformer({
      slug: 'convert',
      transformFile: vi.fn().mockResolvedValue({
        file: new File(['jpeg'], 'a.jpg', { type: 'image/jpeg' }),
        status: 'continue',
      }),
    })
    const req = {
      payload: { config: { upload: { transformers: [convert, jpegStage] } } },
    } as unknown as PayloadRequest

    await transformUploadFile({
      collectionSlug: 'media',
      doc: { mimeType: 'image/png' },
      file: new File(['png'], 'a.png', { type: 'image/png' }),
      pipeline: [{ transformer: convert }],
      req,
    })

    expect(jpegStage.transformFile).toHaveBeenCalledWith(
      expect.objectContaining({
        options: 'jpeg-options',
        source: expect.objectContaining({ mimeType: 'image/jpeg' }),
        originalSource: expect.objectContaining({ mimeType: 'image/png' }),
      }),
    )
  })
  it('should preserve the snapshot while passing working document changes and stage-owned options', async () => {
    const doc = {
      filename: 'logo.png',
      mimeType: 'image/png',
      title: 'initial',
      nested: { value: 1 },
    }
    const seen: unknown[] = []
    const first = makeTransformer({
      slug: 'first',
      transformFile: async ({ doc, originalDoc, options }) => {
        seen.push(options)
        doc.title = 'changed'
        expect(() => {
          originalDoc.nested.value = 9
        }).toThrow()
        return { status: 'continue' }
      },
    })
    const second = makeTransformer({
      slug: 'second',
      transformFile: async ({ doc, originalDoc, options }) => {
        seen.push([doc.title, originalDoc.title, originalDoc.nested.value, options])
        return { status: 'continue' }
      },
    })

    await transformUploadFile({
      collectionSlug: 'media',
      doc,
      file: new File(['original'], 'logo.png', { type: 'image/png' }),
      pipeline: [
        { transformer: first, options: 'first-options' },
        { transformer: second, options: 'second-options' },
      ],
      req: makeReq(),
    })

    expect(seen).toEqual(['first-options', ['changed', 'initial', 1, 'second-options']])
  })
})
