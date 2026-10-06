import type { FormState } from 'payload'

import { dequal } from 'dequal/lite'
import { describe, expect, it } from 'vitest'

import { fieldReducer } from './fieldReducer.js'

describe('fieldReducer server synchronization', () => {
  it('should request row metadata again when an older response omits a newly added block', () => {
    const initialState: FormState = {
      layout: { disableFormData: true, rows: [], value: 0 },
    }
    const prevStateRef = { current: initialState }
    const stateWithBlock = fieldReducer(initialState, {
      type: 'ADD_ROW',
      blockType: 'text',
      path: 'layout',
      subFieldState: { id: { value: 'new-block' } },
    })
    const mergedState = fieldReducer(stateWithBlock, {
      type: 'MERGE_SERVER_STATE',
      prevStateRef,
      serverState: initialState,
    })

    expect(mergedState.layout.rows).toEqual([
      { id: 'new-block', blockType: 'text', isLoading: true },
    ])
    expect(mergedState.layout.value).toBe(1)
    expect(dequal(mergedState, prevStateRef.current)).toBe(false)

    const synchronizedState = fieldReducer(mergedState, {
      type: 'MERGE_SERVER_STATE',
      prevStateRef,
      serverState: {
        ...mergedState,
        layout: {
          ...mergedState.layout,
          rows: [{ id: 'new-block', blockType: 'text', isLoading: false }],
        },
      },
    })

    expect(synchronizedState.layout.rows[0].isLoading).toBe(false)
    expect(dequal(synchronizedState, prevStateRef.current)).toBe(true)
  })

  it('should keep nested optimistic rows eligible for synchronization', () => {
    const initialState: FormState = {
      layout: { rows: [{ id: 'parent-block', isLoading: false }], value: 1 },
      'layout.0.items': { rows: [], value: 0 },
    }
    const prevStateRef = { current: initialState }
    const stateWithRow = fieldReducer(initialState, {
      type: 'ADD_ROW',
      path: 'layout.0.items',
      subFieldState: { id: { value: 'nested-row' } },
    })
    const mergedState = fieldReducer(stateWithRow, {
      type: 'MERGE_SERVER_STATE',
      prevStateRef,
      serverState: initialState,
    })

    expect(mergedState.layout.rows[0].isLoading).toBe(false)
    expect(mergedState['layout.0.items'].rows).toEqual([{ id: 'nested-row', isLoading: true }])
    expect(dequal(mergedState, prevStateRef.current)).toBe(false)
  })

  it('should synchronize an explicit save that removes an optimistic row', () => {
    const initialState: FormState = { layout: { rows: [], value: 0 } }
    const prevStateRef = { current: initialState }
    const stateWithRow = fieldReducer(initialState, {
      type: 'ADD_ROW',
      path: 'layout',
    })
    const mergedState = fieldReducer(stateWithRow, {
      type: 'MERGE_SERVER_STATE',
      acceptValues: true,
      prevStateRef,
      serverState: initialState,
    })

    expect(mergedState.layout.rows).toEqual([])
    expect(mergedState.layout.value).toBe(0)
    expect(dequal(mergedState, prevStateRef.current)).toBe(true)
  })
})
