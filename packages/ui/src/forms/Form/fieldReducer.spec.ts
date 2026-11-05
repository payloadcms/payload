import type { FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import { fieldReducer } from './fieldReducer.js'

describe('fieldReducer UPDATE', () => {
  it('marks the edited field isModified', () => {
    const state: FormState = {
      color: { initialValue: 'light', value: 'light' },
    }
    const next = fieldReducer(state, { path: 'color', type: 'UPDATE', value: 'dark' })
    expect(next.color.isModified).toBe(true)
  })

  it('keeps isModified on other fields edited earlier', () => {
    // Color was edited while an autosave is in flight, then size is edited.
    // The stale autosave response must still not overwrite color.
    const state: FormState = {
      color: { initialValue: 'light', isModified: true, value: 'dark' },
      size: { initialValue: 'small', value: 'small' },
    }
    const next = fieldReducer(state, { path: 'size', type: 'UPDATE', value: 'large' })
    expect(next.size.isModified).toBe(true)
    expect(next.color.isModified).toBe(true)
    expect(next.color.value).toBe('dark')
  })
})
