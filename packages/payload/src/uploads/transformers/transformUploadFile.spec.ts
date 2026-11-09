import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'
import type { FileSource, UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { transformUploadFile } from './transformUploadFile.js'

const readAllText = async (source: FileSource): Promise<string> =>
  new TextDecoder().decode(
    await source.readFileBytes({ numberOfBytes: source.sizeInBytes, startByte: 0 }),
  )

const makeDocs = () => ({
  doc: { alt: 'logo', _transforms: null } as Record<string, unknown>,
  originalDoc: Object.freeze({ alt: 'logo', _transforms: null }),
})

const makeTransformer = (overrides: Partial<UploadTransformer> = {}): UploadTransformer => ({
  mimeTypes: ['image/*'],
  slug: 'test-transformer',
  transformFile: vi.fn().mockResolvedValue({ status: 'continue' }),
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
    getOptions: () => undefined,
    originalFile: new File(['original'], 'logo.png'),
    req: {} as PayloadRequest,
    ...args,
  })

describe('transformUploadFile', () => {
  it('should replace the file and pass it to the next stage when a stage returns continue with a file', async () => {
    const replacement = new File(['replaced'], 'logo.png')
    const first = makeTransformer({
      transformFile: vi.fn().mockResolvedValue({ file: replacement, status: 'continue' }),
    })
    const second = makeTransformer()

    const outputFile = await runPipeline({ pipeline: [first, second] })

    expect(second.transformFile).toHaveBeenCalledWith(
      expect.objectContaining({ file: replacement }),
    )
    expect(outputFile).toBe(replacement)
  })

  it('should replace the file and stop the pipeline when a stage returns complete', async () => {
    const completeFile = new File(['done'], 'logo.png')
    const first = makeTransformer({
      transformFile: vi.fn().mockResolvedValue({ file: completeFile, status: 'complete' }),
    })
    const second = makeTransformer()

    const outputFile = await runPipeline({ pipeline: [first, second] })

    expect(outputFile).toBe(completeFile)
    expect(second.transformFile).not.toHaveBeenCalled()
  })

  it('should propagate a thrown error without calling later stages', async () => {
    const first = makeTransformer({
      transformFile: vi.fn().mockRejectedValue(new Error('transform failed')),
    })
    const second = makeTransformer()

    await expect(runPipeline({ pipeline: [first, second] })).rejects.toThrow('transform failed')
    expect(second.transformFile).not.toHaveBeenCalled()
  })

  it('should pass each stage the current file as source and the original file as originalSource', async () => {
    const first = makeTransformer({
      transformFile: vi
        .fn()
        .mockResolvedValue({ file: new File(['cropped'], 'logo.png'), status: 'continue' }),
    })
    const second = makeTransformer()

    await runPipeline({ file: new File(['resized'], 'logo.png'), pipeline: [first, second] })

    const sourceTexts = await Promise.all(
      [first, second].map(async ({ transformFile }) => {
        const { originalSource, source } = vi.mocked(transformFile!).mock.calls[0]![0]

        return [await readAllText(source), await readAllText(originalSource)]
      }),
    )

    expect(sourceTexts).toEqual([
      ['resized', 'original'],
      ['cropped', 'original'],
    ])
  })

  it('should pass a _transforms change to later stages and keep it in doc', async () => {
    const first = makeTransformer({
      transformFile: vi.fn(({ doc }) => {
        doc._transforms = { score: 1 }
        return Promise.resolve({ status: 'continue' as const })
      }),
    })
    const second = makeTransformer()
    const docs = makeDocs()

    await runPipeline({ ...docs, pipeline: [first, second] })

    expect(second.transformFile).toHaveBeenCalledWith(
      expect.objectContaining({
        doc: expect.objectContaining({ _transforms: { score: 1 } }),
        originalDoc: expect.objectContaining({ _transforms: null }),
      }),
    )
    expect(docs.doc._transforms).toEqual({ score: 1 })
  })

  const makeCropChanger = () =>
    makeTransformer({
      slug: 'first',
      transformFile: vi.fn(({ doc }) => {
        doc._transforms = { crop: { height: 1, width: 1, x: 0, y: 0 } }
        return Promise.resolve({ status: 'continue' as const })
      }),
    })

  it('should reject a stage that changes a _transforms key another stage claims, and stop the pipeline', async () => {
    const second = makeTransformer({ slug: 'second' })

    const result = runPipeline({
      claims: new Map([[second, ['crop']]]),
      pipeline: [makeCropChanger(), second],
    })

    await expect(result).rejects.toThrow(TransformerContractError)
    await expect(result).rejects.toThrow(/"first".*_transforms\.crop.*"second"/)
    expect(second.transformFile).not.toHaveBeenCalled()
  })

  it('should let a stage change a _transforms key it claims itself', async () => {
    const first = makeCropChanger()

    await expect(
      runPipeline({ claims: new Map([[first, ['crop']]]), pipeline: [first] }),
    ).resolves.toBeInstanceOf(File)
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
      const second = makeTransformer()

      const result = runPipeline({ pipeline: [first, second] })

      await expect(result).rejects.toThrow(TransformerContractError)
      await expect(result).rejects.toThrow('"first"')
      expect(second.transformFile).not.toHaveBeenCalled()
    },
  )
})
