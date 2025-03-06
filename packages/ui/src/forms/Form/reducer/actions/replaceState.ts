import type { FormState } from 'payload'

import { dequal } from 'dequal/lite' // lite: no need for Map and Set support

import type { REPLACE_STATE } from '../types.js'

export const replaceState = (state: FormState, action: REPLACE_STATE): FormState => {
  if (action.optimize !== false) {
    // Only update fields that have changed
    // by comparing old value / initialValue to new
    // ..
    // This is a performance enhancement for saving
    // large documents with hundreds of fields
    const newState: FormState = {}

    for (const [path, newField] of Object.entries(action.state)) {
      const oldField = state[path]

      if (newField.valid !== false) {
        newField.valid = true
      }
      if (newField.passesCondition !== false) {
        newField.passesCondition = true
      }

      if (!dequal(oldField, newField)) {
        newState[path] = newField
      } else if (oldField) {
        newState[path] = oldField
      }
    }

    return newState
  }

  // TODO: Remove this in 4.0 - this is a temporary fix to prevent a breaking change
  if (action.sanitize) {
    for (const field of Object.values(action.state)) {
      if (field.valid !== false) {
        field.valid = true
      }
      if (field.passesCondition !== false) {
        field.passesCondition = true
      }
    }
  }

  // If we're not optimizing, just set the state to the new state
  return action.state
}
