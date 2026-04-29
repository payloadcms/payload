import type { FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import { fieldReducer } from './fieldReducer.js'

describe('fieldReducer.MERGE_RENDERED_FIELDS', () => {
  it('writes payloads into customComponents using slot-to-key translation', () => {
    const initial: FormState = {
      'posts.advanced': { passesCondition: false, value: undefined },
      'posts.title': { value: 'hello' },
    }
    const result = fieldReducer(initial, {
      rendered: [
        { path: 'posts.advanced', payload: 'rendered-field' as never, slot: 'Field' },
        { path: 'posts.advanced', payload: 'rendered-after' as never, slot: 'afterInput' },
      ],
      type: 'MERGE_RENDERED_FIELDS',
    })

    expect(result['posts.advanced']?.customComponents).toEqual({
      AfterInput: 'rendered-after',
      Field: 'rendered-field',
    })
    // Critically: passesCondition is preserved verbatim (no defaulting to true).
    expect(result['posts.advanced']?.passesCondition).toBe(false)
    expect(result['posts.title']).toBe(initial['posts.title'])
  })

  it('preserves existing customComponents on the same path', () => {
    const initial: FormState = {
      'posts.title': {
        customComponents: { Description: 'desc-existing' },
        value: 'hi',
      },
    }
    const result = fieldReducer(initial, {
      rendered: [{ path: 'posts.title', payload: 'field-new' as never, slot: 'Field' }],
      type: 'MERGE_RENDERED_FIELDS',
    })

    expect(result['posts.title']?.customComponents).toEqual({
      Description: 'desc-existing',
      Field: 'field-new',
    })
  })

  it('returns the original state when rendered is empty', () => {
    const initial: FormState = { 'posts.title': { value: 'hi' } }
    expect(fieldReducer(initial, { rendered: [], type: 'MERGE_RENDERED_FIELDS' })).toBe(initial)
  })

  it('writes into a previously absent path by initializing the field state', () => {
    const initial: FormState = {}
    const result = fieldReducer(initial, {
      rendered: [{ path: 'posts.new', payload: 'fresh' as never, slot: 'Field' }],
      type: 'MERGE_RENDERED_FIELDS',
    })
    expect(result['posts.new']?.customComponents).toEqual({ Field: 'fresh' })
  })
})
