import type { FormState, Row } from 'payload'

import ObjectIdImport from 'bson-objectid'

import type { ADD_ROW } from '../types.js'

import { flattenRows } from '../helpers/flattenRows.js'
import { separateRows } from '../helpers/separateRows.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export const addRow = (state: FormState, action: ADD_ROW): FormState => {
  const { blockType, path, rowIndex: rowIndexFromArgs, subFieldState = {} } = action

  const rowIndex =
    typeof rowIndexFromArgs === 'number' ? rowIndexFromArgs : state[path]?.rows?.length || 0

  const withNewRow = [...(state[path]?.rows || [])]

  const newRow: Row = {
    id: (subFieldState?.id?.value as string) || new ObjectId().toHexString(),
    blockType: blockType || undefined,
    collapsed: false,
    isLoading: true,
  }

  withNewRow.splice(rowIndex, 0, newRow)

  if (blockType) {
    subFieldState.blockType = {
      initialValue: blockType,
      valid: true,
      value: blockType,
    }
  }

  // add new row to array _field state_
  const { remainingFields, rows: siblingRows } = separateRows(path, state)

  siblingRows.splice(rowIndex, 0, subFieldState)

  const newState: FormState = {
    ...remainingFields,
    ...flattenRows(path, siblingRows),
    [`${path}.${rowIndex}.id`]: {
      initialValue: newRow.id,
      passesCondition: true,
      requiresRender: true,
      valid: true,
      value: newRow.id,
    },
    [path]: {
      ...state[path],
      disableFormData: true,
      requiresRender: true,
      rows: withNewRow,
      value: siblingRows.length,
    },
  }

  return newState
}
