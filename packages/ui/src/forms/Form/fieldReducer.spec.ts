import type { FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import { fieldReducer } from './fieldReducer.js'

describe('fieldReducer', () => {
  it('should sanitize non-optimized state replacements', () => {
    const state: FormState = {}

    const result = fieldReducer(state, {
      optimize: false,
      state: {
        title: {},
      },
      type: 'REPLACE_STATE',
    })

    expect(result.title).toMatchObject({
      passesCondition: true,
      valid: true,
    })
  })
})
