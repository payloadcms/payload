import type { FormState } from 'payload'

import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { getDataFromFormState } from 'payload/shared'

import type { FieldAction } from './types.js'

export const changesFormData = ({
  action,
  currentState,
}: {
  action: FieldAction
  currentState: FormState
}): boolean => {
  if (action.type === 'UPDATE') {
    const currentField = currentState[action.path]

    return (
      ('disableFormData' in action && action.disableFormData !== currentField?.disableFormData) ||
      ('rows' in action && !dequal(action.rows, currentField?.rows)) ||
      ('value' in action && !dequal(action.value, currentField?.value))
    )
  }

  if (action.type === 'MODIFY_CONDITION') {
    return action.result !== currentState[action.path]?.passesCondition
  }

  if (action.type === 'REMOVE') {
    return action.path in currentState
  }

  if (action.type === 'REPLACE_STATE') {
    return !dequal(
      getDataFromFormState(action.state, true),
      getDataFromFormState(currentState, true),
    )
  }

  if (action.type === 'UPDATE_MANY') {
    return !dequal(
      getDataFromFormState({ ...currentState, ...action.formState }, true),
      getDataFromFormState(currentState, true),
    )
  }

  return ['ADD_ROW', 'DUPLICATE_ROW', 'MOVE_ROW', 'REMOVE_ROW', 'REPLACE_ROW'].includes(action.type)
}
