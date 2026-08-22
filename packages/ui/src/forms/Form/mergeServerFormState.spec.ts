import { describe, expect, it } from 'vitest'
import { mergeServerFormState } from './mergeServerFormState'

describe('mergeServerFormState', () => {
  it('merges new nested array fields when the array exists in currentState', () => {
    const currentState = {
      items: {
        value: 1,
        rows: [{ id: 'row-1' }],
      },
    }

    const incomingState = {
      items: {
        value: 1,
        rows: [{ id: 'row-1' }],
      },
      'items.0.title': {
        value: 'Hello',
        initialValue: 'Hello',
        valid: true,
        passesCondition: true,
        customComponents: {
          Field: () => null,
        },
      },
    }

    const merged = mergeServerFormState({
      currentState,
      incomingState,
    })

    expect(merged['items.0.title']).toBeDefined()
    expect(merged['items.0.title']?.value).toBe('Hello')
    expect(merged['items.0.title']?.customComponents?.Field).toBeDefined()
  })

  it('drops fields that are not in currentState and not in an existing array', () => {
    const currentState = {
      title: {
        value: 'Original',
      },
    }

    const incomingState = {
      unknownField: {
        value: 'Ghost',
      },
    }

    const merged = mergeServerFormState({
      currentState,
      incomingState,
    })

    expect(merged.unknownField).toBeUndefined()
  })
})
