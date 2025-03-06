'use client'
import type { FormState } from 'payload'

import type { FieldAction } from './types.js'

import { addRow } from './actions/addRow.js'
import { addServerErrors } from './actions/addServerErrors.js'
import { duplicateRow } from './actions/duplicateRow.js'
import { moveRow } from './actions/moveRow.js'
import { removeRow } from './actions/removeRow.js'
import { replaceRow } from './actions/replaceRow.js'
import { replaceState } from './actions/replaceState.js'
import { update } from './actions/update.js'

/**
 * Reducer which modifies the form field state (all the current data of the fields in the form). When called using dispatch, it will return a new state object.
 */
export function fieldReducer(state: FormState, action: FieldAction): FormState {
  switch (action.type) {
    case 'ADD_ROW': {
      return addRow(state, action)
    }

    case 'ADD_SERVER_ERRORS': {
      return addServerErrors(state, action)
    }

    case 'DUPLICATE_ROW': {
      return duplicateRow(state, action)
    }

    case 'MOVE_ROW': {
      return moveRow(state, action)
    }

    case 'REMOVE': {
      const newState = { ...state }

      if (newState[action.path]) {
        delete newState[action.path]
      }

      return newState
    }

    case 'REMOVE_ROW': {
      return removeRow(state, action)
    }

    case 'REPLACE_ROW': {
      return replaceRow(state, action)
    }

    case 'REPLACE_STATE': {
      return replaceState(state, action)
    }

    case 'SET_ALL_ROWS_COLLAPSED': {
      const { path, updatedRows } = action

      return {
        ...state,
        [path]: {
          ...state[path],
          rows: updatedRows,
        },
      }
    }

    case 'SET_ROW_COLLAPSED': {
      const { path, updatedRows } = action

      const newState = {
        ...state,
        [path]: {
          ...state[path],
          rows: updatedRows,
        },
      }

      return newState
    }

    case 'UPDATE': {
      return update(state, action)
    }

    case 'UPDATE_MANY': {
      const newState = { ...state }

      Object.entries(action.formState).forEach(([path, field]) => {
        newState[path] = field
      })

      return newState
    }

    default: {
      return state
    }
  }
}
