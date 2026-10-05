import { describe, expect, it } from 'vitest'

import type { PlannedTransformer } from '../transformers/types.js'

import { assertTransformCoverage } from './assertTransformCoverage.js'

const stage = ({ keys, slug }: { keys?: string[]; slug: string }): PlannedTransformer => ({
  handledTransformKeys: keys,
  transformer: { mimeTypes: ['*/*'], slug },
})

describe('assertTransformCoverage', () => {
  it('should accept custom keys without schema definitions when each has one owner', () => {
    expect(() =>
      assertTransformCoverage({
        pipeline: [stage({ keys: ['custom'], slug: 'a' })],
        state: { custom: [1, 2] },
      }),
    ).not.toThrow()
  })

  it('should reject missing coverage', () => {
    expect(() =>
      assertTransformCoverage({ pipeline: [stage({ slug: 'a' })], state: { custom: 1 } }),
    ).toThrow('custom')
  })

  it('should reject duplicate ownership', () => {
    expect(() =>
      assertTransformCoverage({
        pipeline: [stage({ keys: ['custom'], slug: 'a' }), stage({ keys: ['custom'], slug: 'b' })],
        state: { custom: 1 },
      }),
    ).toThrow('custom')
  })

  it('should reject claims for absent state and duplicate claims within one adapter', () => {
    expect(() =>
      assertTransformCoverage({ pipeline: [stage({ keys: ['custom'], slug: 'a' })], state: null }),
    ).toThrow('custom')
    expect(() =>
      assertTransformCoverage({
        pipeline: [stage({ keys: ['custom', 'custom'], slug: 'a' })],
        state: { custom: 1 },
      }),
    ).toThrow('custom')
  })
})
