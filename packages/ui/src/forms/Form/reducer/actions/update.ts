import type { FormField, FormState } from 'payload'

import type { UPDATE } from '../types.js'

export const update = (state: FormState, action: UPDATE): FormState => {
  const newField = Object.entries(action).reduce(
    (field, [key, value]) => {
      if (
        [
          'disableFormData',
          'errorMessage',
          'initialValue',
          'rows',
          'valid',
          'validate',
          'value',
        ].includes(key)
      ) {
        return {
          ...field,
          [key]: value,
        }
      }

      return field
    },
    state[action.path] || ({} as FormField),
  )

  const newState = {
    ...state,
    [action.path]: newField,
  }

  return newState
}
