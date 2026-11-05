import type { FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import { fieldReducer } from '../Form/fieldReducer.js'
import { buildNullifyLocaleFieldUpdate } from './index.js'

describe('buildNullifyLocaleFieldUpdate', () => {
  it('should retain the local empty-array marker after a sibling field changes', () => {
    const initialState: FormState = {
      items: {
        rows: [],
      },
      title: {
        value: 'Before',
      },
    }

    const stateWithoutFallback = fieldReducer(
      initialState,
      buildNullifyLocaleFieldUpdate({
        fieldValue: null,
        path: 'items',
        useFallback: false,
      }),
    )
    const stateWithSiblingChange = fieldReducer(stateWithoutFallback, {
      path: 'title',
      type: 'UPDATE',
      value: 'After',
    })

    expect(stateWithSiblingChange.items).toMatchObject({
      disableFormData: false,
      rows: [],
      value: 0,
    })
  })

  it('should clear the local empty-array marker when fallback is enabled', () => {
    expect(
      buildNullifyLocaleFieldUpdate({
        fieldValue: 0,
        path: 'items',
        useFallback: true,
      }),
    ).toMatchObject({
      disableFormData: undefined,
      value: null,
    })
  })
})
