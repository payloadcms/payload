import { describe, expect, it } from 'vitest'

import type { UploadTransformer } from './types.js'

import { validateTransformers } from './validateTransformers.js'

const makeTransformer = (overrides: Partial<UploadTransformer> = {}): UploadTransformer => ({
  mimeTypes: ['image/*'],
  slug: 'test-transformer',
  ...overrides,
})

describe('validateTransformers', () => {
  it.each(['', '   '])('should throw when a transformer has an empty slug (%j)', (slug) => {
    const transformer = makeTransformer({ slug })

    expect(() => validateTransformers({ transformers: [transformer] })).toThrow(/slug/i)
  })

  it.each([{ mimeTypes: [] }, { mimeTypes: ['image'] }, { mimeTypes: ['*/png'] }])(
    'should throw for the invalid MIME types $mimeTypes',
    ({ mimeTypes }) => {
      const transformer = makeTransformer({ mimeTypes })

      expect(() => validateTransformers({ transformers: [transformer] })).toThrow(/mime/i)
    },
  )

  it.each(['init', 'canTransform', 'transformFile', 'handleRequest'] as const)(
    'should throw when %s is present but not a function',
    (capability) => {
      const transformer = makeTransformer({
        [capability]: 'not-a-function',
      } as Partial<UploadTransformer>)

      expect(() => validateTransformers({ transformers: [transformer] })).toThrow(
        new RegExp(capability, 'i'),
      )
    },
  )

  it('should throw and identify every duplicate slug, including non-adjacent duplicates', () => {
    const transformers = [
      makeTransformer({ slug: 'a' }),
      makeTransformer({ slug: 'b' }),
      makeTransformer({ slug: 'a' }),
      makeTransformer({ slug: 'c' }),
      makeTransformer({ slug: 'b' }),
    ]

    expect(() => validateTransformers({ transformers })).toThrow(/"a".*"b"|"b".*"a"/is)
  })

  it.each([
    {
      name: 'redefines a built-in key',
      definition: { key: 'crop', schema: { type: 'object' } },
      error: /"crop".*built-in/i,
    },
    {
      name: 'has an empty key',
      definition: { key: '', schema: { type: 'object' } },
      error: /key/i,
    },
    {
      name: 'has a schema that is not a JSON Schema',
      definition: { key: 'watermark', schema: { type: 'not-a-type' } },
      error: /"watermark".*schema/i,
    },
    {
      name: 'has a $ref into its own schema, which is merged under another root',
      definition: {
        key: 'watermark',
        schema: {
          type: 'object',
          $defs: { text: { type: 'string' } },
          properties: { text: { $ref: '#/$defs/text' } },
        },
      },
      error: /"watermark".*schema/i,
    },
    {
      name: 'has a validate that is not a function',
      definition: { key: 'watermark', schema: { type: 'object' }, validate: 'no' },
      error: /"watermark".*validate/i,
    },
  ])('should throw when a transform definition $name', ({ definition, error }) => {
    const transformer = makeTransformer({
      transformDefinitions: [definition],
    } as unknown as Partial<UploadTransformer>)

    expect(() => validateTransformers({ transformers: [transformer] })).toThrow(error)
  })

  it('should throw when two transformers define the same key', () => {
    const definition = { key: 'watermark', schema: { type: 'object' } as const }
    const transformers = [
      makeTransformer({ slug: 'a', transformDefinitions: [definition] }),
      makeTransformer({ slug: 'b', transformDefinitions: [definition] }),
    ]

    expect(() => validateTransformers({ transformers })).toThrow(/"watermark".*"a".*"b"/is)
  })

  it('should report multiple distinct problems across transformers in a single error', () => {
    const transformers = [makeTransformer({ mimeTypes: [] }), makeTransformer({ slug: '' })]

    expect(() => validateTransformers({ transformers })).toThrow(/mime.*slug|slug.*mime/is)
  })
})
