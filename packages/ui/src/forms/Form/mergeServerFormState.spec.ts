import type { FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import { fieldReducer } from './fieldReducer.js'
import { mergeServerFormState } from './mergeServerFormState.js'

const autosave = { overrideLocalChanges: false } as const

describe('mergeServerFormState autosave protection', () => {
  it('repro: a stale autosave response does not overwrite a field changed after the request was sent', () => {
    let state: FormState = {
      color: { initialValue: 'light', value: 'light' },
      size: { initialValue: 'small', value: 'small' },
    }
    // autosave request goes out with color=light, then the user edits color and size
    state = fieldReducer(state, { path: 'color', type: 'UPDATE', value: 'dark' })
    state = fieldReducer(state, { path: 'size', type: 'UPDATE', value: 'large' })
    // the in-flight response answers with the state at send time
    const merged = mergeServerFormState({
      acceptValues: autosave,
      currentState: state,
      incomingState: {
        color: { initialValue: 'light', value: 'light' },
        size: { initialValue: 'small', value: 'small' },
      },
    })
    expect(merged.color.value).toBe('dark')
    expect(merged.size.value).toBe('large')
  })

  it('releases isModified once a response echoes the local value', () => {
    const currentState: FormState = {
      color: { initialValue: 'light', isModified: true, value: 'dark' },
    }
    const merged = mergeServerFormState({
      acceptValues: autosave,
      currentState,
      incomingState: { color: { initialValue: 'light', value: 'dark' } },
    })
    expect(merged.color.value).toBe('dark')
    expect(merged.color.isModified).toBeUndefined()

    // a later response with a different server value is accepted again
    const later = mergeServerFormState({
      acceptValues: autosave,
      currentState: merged,
      incomingState: { color: { initialValue: 'light', value: 'light' } },
    })
    expect(later.color.value).toBe('light')
  })

  it('keeps isModified when the response carries a server-side transformed value', () => {
    const currentState: FormState = {
      title: { initialValue: 'Hello', isModified: true, value: 'Hello World' },
    }
    const merged = mergeServerFormState({
      acceptValues: autosave,
      currentState,
      incomingState: { title: { initialValue: 'Hello', value: 'hello-world' } },
    })
    expect(merged.title.value).toBe('Hello World')
    expect(merged.title.isModified).toBe(true)
  })

  it('explicit save overrides local changes and releases the protection', () => {
    const currentState: FormState = {
      color: { initialValue: 'light', isModified: true, value: 'dark' },
    }
    const merged = mergeServerFormState({
      acceptValues: true,
      currentState,
      incomingState: { color: { initialValue: 'light', value: 'light' } },
    })
    expect(merged.color.value).toBe('light')
    expect(merged.color.isModified).toBeUndefined()

    // a later autosave response with a changed server value is accepted again
    const later = mergeServerFormState({
      acceptValues: autosave,
      currentState: merged,
      incomingState: { color: { initialValue: 'light', value: 'blue' } },
    })
    expect(later.color.value).toBe('blue')
  })
})
