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

  it('should throw when a transformer declares no MIME types', () => {
    const transformer = makeTransformer({ mimeTypes: [] })

    expect(() => validateTransformers({ transformers: [transformer] })).toThrow(/mime/i)
  })

  it.each(['image', '*/png'])('should throw for the invalid MIME pattern %j', (mimeType) => {
    const transformer = makeTransformer({ mimeTypes: [mimeType] })

    expect(() => validateTransformers({ transformers: [transformer] })).toThrow(/mime/i)
  })

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

  it('should report multiple distinct problems across transformers in a single error', () => {
    const transformers = [makeTransformer({ mimeTypes: [] }), makeTransformer({ slug: '' })]

    expect(() => validateTransformers({ transformers })).toThrow(/mime.*slug|slug.*mime/is)
  })
})
