import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { transformUploadFile } from './transformUploadFile.js'

const makeReq = (): PayloadRequest => ({}) as unknown as PayloadRequest

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes)

const makeDocs = (doc: Record<string, unknown> = { alt: 'logo', _transforms: null }) => ({
  doc: structuredClone(doc),
  originalDoc: Object.freeze(structuredClone(doc)),
  unchangedDoc: Object.freeze(structuredClone(doc)),
})

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
      ...makeDocs(),
      options: undefined,
      originalFile: new File(['original'], 'logo.png'),
      pipeline: [first, second],
      req: makeReq(),
    })

    expect(second.transformFile).toHaveBeenCalledWith(
      expect.objectContaining({ file: replacement }),
    )
    expect(result.file).toBe(replacement)
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
      ...makeDocs(),
      options: undefined,
      originalFile: new File(['original'], 'logo.png'),
      pipeline: [first, second],
      req: makeReq(),
    })

    expect(result.file).toBe(completeFile)
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
        ...makeDocs(),
        options: undefined,
        originalFile: new File(['original'], 'logo.png'),
        pipeline: [first, second],
        req: makeReq(),
      }),
    ).rejects.toThrow('transform failed')

    expect(second.transformFile).not.toHaveBeenCalled()
  })

  it('should pass each stage the current file as source and the original file as originalSource', async () => {
    const seen: { originalSource: string; source: string }[] = []
    const record = vi.fn(async ({ originalSource, source }) => {
      seen.push({
        originalSource: decode(
          await originalSource.readFileBytes({
            numberOfBytes: originalSource.sizeInBytes,
            startByte: 0,
          }),
        ),
        source: decode(
          await source.readFileBytes({ numberOfBytes: source.sizeInBytes, startByte: 0 }),
        ),
      })
    })
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn(async (args) => {
        await record(args)
        return { file: new File(['cropped'], 'logo.png'), status: 'continue' as const }
      }),
    })
    const second = makeTransformer({
      slug: 'second',
      transformFile: vi.fn(async (args) => {
        await record(args)
        return { status: 'continue' as const }
      }),
    })

    await transformUploadFile({
      collectionSlug: 'media',
      file: new File(['resized'], 'logo.png'),
      ...makeDocs(),
      options: undefined,
      originalFile: new File(['original'], 'logo.png'),
      pipeline: [first, second],
      req: makeReq(),
    })

    expect(seen).toEqual([
      { originalSource: 'original', source: 'resized' },
      { originalSource: 'original', source: 'cropped' },
    ])
  })

  it('should pass a _transforms change to later stages and return it in doc', async () => {
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn(({ doc }) => {
        doc._transforms = { score: 1 }
        return Promise.resolve({ status: 'continue' as const })
      }),
    })
    const second = makeTransformer({
      slug: 'second',
      transformFile: vi.fn().mockResolvedValue({ status: 'continue' }),
    })
    const docs = makeDocs()

    const result = await transformUploadFile({
      collectionSlug: 'media',
      file: new File(['original'], 'logo.png'),
      ...docs,
      options: undefined,
      originalFile: new File(['original'], 'logo.png'),
      pipeline: [first, second],
      req: makeReq(),
    })

    expect(second.transformFile).toHaveBeenCalledWith(
      expect.objectContaining({
        doc: expect.objectContaining({ _transforms: { score: 1 } }),
        originalDoc: expect.objectContaining({ _transforms: null }),
      }),
    )
    expect(result.doc._transforms).toEqual({ score: 1 })
    expect(docs.originalDoc._transforms).toBeNull()
  })

  it.each([
    ['change a field', (doc: Record<string, unknown>) => (doc.alt = 'changed')],
    ['add a field', (doc: Record<string, unknown>) => (doc.width = 10)],
    ['remove a field', (doc: Record<string, unknown>) => delete doc.alt],
  ])(
    'should reject a stage that tries to %s other than _transforms, and stop the pipeline',
    async (_name, change) => {
      const first = makeTransformer({
        slug: 'first',
        transformFile: vi.fn(({ doc }) => {
          change(doc)
          return Promise.resolve({ status: 'continue' as const })
        }),
      })
      const second = makeTransformer({ slug: 'second', transformFile: vi.fn() })

      const result = transformUploadFile({
        collectionSlug: 'media',
        file: new File(['original'], 'logo.png'),
        ...makeDocs(),
        options: undefined,
        originalFile: new File(['original'], 'logo.png'),
        pipeline: [first, second],
        req: makeReq(),
      })

      await expect(result).rejects.toThrow(TransformerContractError)
      await expect(result).rejects.toThrow('"first"')
      expect(second.transformFile).not.toHaveBeenCalled()
    },
  )

  it('should allow originalDoc to differ from doc, because it is the stored document', async () => {
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn().mockResolvedValue({ status: 'continue' }),
    })
    const doc = { alt: 'new', _transforms: null }

    await expect(
      transformUploadFile({
        collectionSlug: 'media',
        doc: structuredClone(doc),
        file: new File(['original'], 'logo.png'),
        options: undefined,
        originalDoc: Object.freeze({ alt: 'old', _transforms: { crop: 'stored' } }),
        originalFile: new File(['original'], 'logo.png'),
        pipeline: [first],
        req: makeReq(),
        unchangedDoc: Object.freeze(structuredClone(doc)),
      }),
    ).resolves.toMatchObject({ doc })
  })
})
