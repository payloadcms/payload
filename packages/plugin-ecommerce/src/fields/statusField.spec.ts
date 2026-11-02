import { describe, expect, it } from 'vitest'

import { statusOptions } from './statusField.js'

describe('statusOptions', () => {
  it('should expose processing for an atomically claimed transaction', () => {
    expect(
      statusOptions.map((option) => (typeof option === 'string' ? option : option.value)),
    ).toContain('processing')
  })
})
