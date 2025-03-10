import type { FormState } from 'payload'

import ObjectIdImport from 'bson-objectid'
import { deepCopyObjectSimple, deepCopyObjectSimpleWithoutReactComponents } from 'payload/shared'

import type { DUPLICATE_ROW } from '../types.js'

import { flattenRows } from '../helpers/flattenRows.js'
import { separateRows } from '../helpers/separateRows.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export const duplicateRow = (state: FormState, action: DUPLICATE_ROW): FormState => {
  const { path, rowIndex } = action
  const { remainingFields, rows } = separateRows(path, state)
  const rowsMetadata = [...(state[path].rows || [])]

  const duplicateRowMetadata = deepCopyObjectSimple(rowsMetadata[rowIndex])
  if (duplicateRowMetadata.id) {
    duplicateRowMetadata.id = new ObjectId().toHexString()
  }

  const duplicateRowState = deepCopyObjectSimpleWithoutReactComponents(rows[rowIndex])
  if (duplicateRowState.id) {
    duplicateRowState.id.value = new ObjectId().toHexString()
    duplicateRowState.id.initialValue = new ObjectId().toHexString()
  }

  for (const key of Object.keys(duplicateRowState).filter((key) => key.endsWith('.id'))) {
    const idState = duplicateRowState[key]

    if (idState && typeof idState.value === 'string' && ObjectId.isValid(idState.value)) {
      duplicateRowState[key].value = new ObjectId().toHexString()
      duplicateRowState[key].initialValue = new ObjectId().toHexString()
    }
  }

  // If there are subfields
  if (Object.keys(duplicateRowState).length > 0) {
    // Add new object containing subfield names to unflattenedRows array
    rows.splice(rowIndex + 1, 0, duplicateRowState)
    rowsMetadata.splice(rowIndex + 1, 0, duplicateRowMetadata)
  }

  const newState = {
    ...remainingFields,
    ...flattenRows(path, rows),
    [path]: {
      ...state[path],
      disableFormData: true,
      requiresRender: true,
      rows: rowsMetadata,
      value: rows.length,
    },
  }

  return newState
}
