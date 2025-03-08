import type { FormState } from 'payload'

import ObjectIdImport from 'bson-objectid'

import type { REPLACE_ROW } from '../types.js'

import { flattenRows } from '../helpers/flattenRows.js'
import { separateRows } from '../helpers/separateRows.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export const replaceRow = (state: FormState, action: REPLACE_ROW): FormState => {
  const { blockType, path, rowIndex: rowIndexArg, subFieldState = {} } = action

  const { remainingFields, rows: siblingRows } = separateRows(path, state)
  const rowIndex = Math.max(0, Math.min(rowIndexArg, siblingRows?.length - 1 || 0))

  const rowsMetadata = [...(state[path]?.rows || [])]
  rowsMetadata[rowIndex] = {
    id: new ObjectId().toHexString(),
    blockType: blockType || undefined,
    collapsed: false,
  }

  if (blockType) {
    subFieldState.blockType = {
      initialValue: blockType,
      valid: true,
      value: blockType,
    }
  }

  // replace form _field state_
  siblingRows[rowIndex] = subFieldState

  const newState: FormState = {
    ...remainingFields,
    ...flattenRows(path, siblingRows),
    [path]: {
      ...state[path],
      disableFormData: true,
      rows: rowsMetadata,
      value: siblingRows.length,
    },
  }

  return newState
}
