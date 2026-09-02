import { describe, expect, it } from 'vitest'

import { hashAPIKeySecret } from './hash.js'

describe('hashAPIKeySecret', () => {
  it('should be deterministic for the same input', () => {
    expect(hashAPIKeySecret('plk_abc')).toBe(hashAPIKeySecret('plk_abc'))
  })

  it('should differ for different inputs', () => {
    expect(hashAPIKeySecret('plk_abc')).not.toBe(hashAPIKeySecret('plk_abd'))
  })

  it('should return a 64-character hex string (sha256)', () => {
    expect(hashAPIKeySecret('plk_abc')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('should not depend on any secret or environment state', () => {
    // No parameter for a secret exists at all - this test exists to document the
    // property explicitly, since it's the entire point of this function.
    expect(hashAPIKeySecret).toHaveLength(1)
  })
})
