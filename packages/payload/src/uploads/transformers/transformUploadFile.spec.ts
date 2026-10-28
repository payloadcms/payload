import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'
import type { FileSource, UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { transformUploadFile } from './transformUploadFile.js'

const makeReq = (): PayloadRequest => ({}) as unknown as PayloadRequest

const readAllText = async (source: FileSource): Promise<string> =>
  new TextDecoder().decode(
    await source.readFileBytes({ numberOfBytes: source.sizeInBytes, startByte: 0 }),
  )

const makeDocs = (doc: Record<string, unknown> = { alt: 'logo', _transforms: null }) => ({
  doc: structuredClone(doc),
  originalDoc: Object.freeze(structuredClone(doc)),
})

const makeTransformer = (overrides: Partial<UploadTransformer> = {}): UploadTransformer => ({
  mimeTypes: ['image/*'],
  slug: 'test-transformer',
  ...overrides,
})

const runPipeline = (
  args: Pick<Parameters<typeof transformUploadFile>[0], 'pipeline'> &
    Partial<Parameters<typeof transformUploadFile>[0]>,
) =>
  transformUploadFile({
    claims: new Map(),
    collectionSlug: 'media',
    file: new File(['original'], 'logo.png'),
    ...makeDocs(),
    options: undefined,
    originalFile: new File(['original'], 'logo.png'),
    req: makeReq(),
    ...args,
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
      claims: new Map(),
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
      claims: new Map(),
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
        claims: new Map(),
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
    const makeRecordingTransformer = (output?: File) =>
      makeTransformer({
        transformFile: async ({ originalSource, source }) => {
          seen.push({
            originalSource: await readAllText(originalSource),
            source: await readAllText(source),
          })
          return { file: output, status: 'continue' }
        },
      })

    await runPipeline({
      file: new File(['resized'], 'logo.png'),
      pipeline: [
        makeRecordingTransformer(new File(['cropped'], 'logo.png')),
        makeRecordingTransformer(),
      ],
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

    const result = await runPipeline({ ...docs, pipeline: [first, second] })

    expect(second.transformFile).toHaveBeenCalledWith(
      expect.objectContaining({
        doc: expect.objectContaining({ _transforms: { score: 1 } }),
        originalDoc: expect.objectContaining({ _transforms: null }),
      }),
    )
    expect(result.doc._transforms).toEqual({ score: 1 })
    expect(docs.originalDoc._transforms).toBeNull()
  })

  it('should reject a stage that changes a _transforms key another stage claims, and stop the pipeline', async () => {
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn(({ doc }) => {
        doc._transforms = { crop: { height: 1, width: 1, x: 0, y: 0 } }
        return Promise.resolve({ status: 'continue' as const })
      }),
    })
    const second = makeTransformer({ slug: 'second', transformFile: vi.fn() })

    const result = runPipeline({ claims: new Map([[second, ['crop']]]), pipeline: [first, second] })

    await expect(result).rejects.toThrow(TransformerContractError)
    await expect(result).rejects.toThrow(/"first".*_transforms\.crop.*"second"/)
    expect(second.transformFile).not.toHaveBeenCalled()
  })

  it('should let a stage change a _transforms key it claims itself', async () => {
    const first = makeTransformer({
      slug: 'first',
      transformFile: vi.fn(({ doc }) => {
        doc._transforms = { score: 2 }
        return Promise.resolve({ status: 'continue' as const })
      }),
    })

    const result = await runPipeline({ claims: new Map([[first, ['score']]]), pipeline: [first] })

    expect(result.doc._transforms).toEqual({ score: 2 })
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

      const result = runPipeline({ pipeline: [first, second] })

      await expect(result).rejects.toThrow(TransformerContractError)
      await expect(result).rejects.toThrow('"first"')
      expect(second.transformFile).not.toHaveBeenCalled()
    },
  )
})
