import type { FormState } from 'payload'

import type { REMOVE_ROW } from '../types.js'

import { flattenRows } from '../helpers/flattenRows.js'
import { separateRows } from '../helpers/separateRows.js'

export const removeRow = (state: FormState, action: REMOVE_ROW): FormState => {
  const { path, rowIndex } = action
  const { remainingFields, rows } = separateRows(path, state)
  const rowsMetadata = [...(state[path]?.rows || [])]

  rows.splice(rowIndex, 1)
  rowsMetadata.splice(rowIndex, 1)

  const newState: FormState = {
    ...remainingFields,
    [path]: {
      ...state[path],
      disableFormData: rows.length > 0,
      requiresRender: true,
      rows: rowsMetadata,
      value: rows.length,
    },
    ...flattenRows(path, rows),
  }

  return newState
}
