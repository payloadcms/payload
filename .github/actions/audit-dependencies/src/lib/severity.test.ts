import { describe, expect, it } from 'vitest'

import { isFixable, meetsThreshold } from './severity'

describe('meetsThreshold', () => {
  it('includes critical when the threshold is high', () => {
    expect(meetsThreshold({ advisorySeverity: 'critical', threshold: 'high' })).toBe(true)
    expect(meetsThreshold({ advisorySeverity: 'high', threshold: 'high' })).toBe(true)
  })

  it('excludes lower severities than the threshold', () => {
    expect(meetsThreshold({ advisorySeverity: 'moderate', threshold: 'high' })).toBe(false)
    expect(meetsThreshold({ advisorySeverity: 'low', threshold: 'moderate' })).toBe(false)
  })

  it('includes everything at or above a moderate threshold', () => {
    expect(meetsThreshold({ advisorySeverity: 'moderate', threshold: 'moderate' })).toBe(true)
    expect(meetsThreshold({ advisorySeverity: 'high', threshold: 'moderate' })).toBe(true)
  })
})

describe('isFixable', () => {
  it('flags the pnpm no-fix sentinel as unfixable', () => {
    expect(isFixable('<0.0.0')).toBe(false)
  })

  it('treats a real patched range as fixable', () => {
    expect(isFixable('>=4.17.21')).toBe(true)
  })
})
