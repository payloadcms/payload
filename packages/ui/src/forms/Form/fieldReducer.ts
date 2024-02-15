import { ObjectId } from 'bson'
import equal from 'deep-equal'

import type { FieldAction, FormState, FormField, Row } from './types'

import { deepCopyObject } from 'payload/utilities'
import { flattenRows, separateRows } from './rows'

/**
 * Reducer which modifies the form field state (all the current data of the fields in the form). When called using dispatch, it will return a new state object.
 */
export function fieldReducer(state: FormState, action: FieldAction): FormState {
  switch (action.type) {
    case 'REPLACE_STATE': {
      const newState = {}

      // Only update fields that have changed
      // by comparing old value / initialValue to new
      // ..
      // This is a performance enhancement for saving
      // large documents with hundreds of fields

      Object.entries(action.state).forEach(([path, field]) => {
        const oldField = state[path]
        const newField = field

        if (!equal(oldField, newField)) {
          newState[path] = newField
        } else if (oldField) {
          newState[path] = oldField
        }
      })

      return newState
    }

    case 'REMOVE': {
      const newState = { ...state }
      if (newState[action.path]) delete newState[action.path]
      return newState
    }

    case 'UPDATE': {
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

    case 'REMOVE_ROW': {
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
          rows: rowsMetadata,
          value: rows.length,
        },
        ...flattenRows(path, rows),
      }

      return newState
    }

    case 'ADD_ROW': {
      const { blockType, path, rowIndex: rowIndexFromArgs } = action
      const subFieldState: FormState = {}

      const rowIndex =
        typeof rowIndexFromArgs === 'number' ? rowIndexFromArgs : state[path]?.rows?.length || 0

      const withNewRow = [...(state[path]?.rows || [])]

      const newRow: Row = {
        id: new ObjectId().toHexString(),
        blockType: blockType || undefined,
        collapsed: false,
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
        [path]: {
          ...state[path],
          disableFormData: true,
          rows: withNewRow,
          value: siblingRows.length,
        },
      }

      return newState
    }

    case 'REPLACE_ROW': {
      const { blockType, path, rowIndex: rowIndexArg } = action
      const subFieldState: FormState = {}

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

    case 'DUPLICATE_ROW': {
      const { path, rowIndex } = action
      const { remainingFields, rows } = separateRows(path, state)
      const rowsMetadata = state[path]?.rows || []

      const duplicateRowMetadata = deepCopyObject(rowsMetadata[rowIndex])
      if (duplicateRowMetadata.id) duplicateRowMetadata.id = new ObjectId().toHexString()

      const duplicateRowState = deepCopyObject(rows[rowIndex])
      if (duplicateRowState.id) duplicateRowState.id = new ObjectId().toHexString()

      // If there are subfields
      if (Object.keys(duplicateRowState).length > 0) {
        // Add new object containing subfield names to unflattenedRows array
        rows.splice(rowIndex + 1, 0, duplicateRowState)
        rowsMetadata.splice(rowIndex + 1, 0, duplicateRowMetadata)
      }

      const newState = {
        ...remainingFields,
        [path]: {
          ...state[path],
          disableFormData: true,
          rows: rowsMetadata,
          value: rows.length,
        },
        ...flattenRows(path, rows),
      }

      return newState
    }

    case 'MOVE_ROW': {
      const { moveFromIndex, moveToIndex, path } = action
      const { remainingFields, rows } = separateRows(path, state)

      // copy the row to move
      const copyOfMovingRow = rows[moveFromIndex]
      // delete the row by index
      rows.splice(moveFromIndex, 1)
      // insert row copyOfMovingRow back in
      rows.splice(moveToIndex, 0, copyOfMovingRow)

      // modify array/block internal row state (i.e. collapsed, blockType)
      const rowStateCopy = [...(state[path]?.rows || [])]
      const movingRowState = { ...rowStateCopy[moveFromIndex] }
      rowStateCopy.splice(moveFromIndex, 1)
      rowStateCopy.splice(moveToIndex, 0, movingRowState)

      const newState = {
        ...remainingFields,
        ...flattenRows(path, rows),
        [path]: {
          ...state[path],
          rows: rowStateCopy,
        },
      }

      return newState
    }

    case 'SET_ROW_COLLAPSED': {
      const { collapsed, path, rowID, setDocFieldPreferences } = action

      const arrayState = state[path]

      const { collapsedRowIDs, matchedIndex } = state[path].rows.reduce(
        (acc, row, index) => {
          const isMatchingRow = row.id === rowID
          if (isMatchingRow) acc.matchedIndex = index

          if (!isMatchingRow && row.collapsed) acc.collapsedRowIDs.push(row.id)
          else if (isMatchingRow && collapsed) acc.collapsedRowIDs.push(row.id)

          return acc
        },
        {
          collapsedRowIDs: [],
          matchedIndex: undefined,
        },
      )

      if (matchedIndex > -1) {
        arrayState.rows[matchedIndex].collapsed = collapsed
        setDocFieldPreferences(path, { collapsed: collapsedRowIDs })
      }

      const newState = {
        ...state,
        [path]: {
          ...arrayState,
        },
      }

      return newState
    }

    case 'SET_ALL_ROWS_COLLAPSED': {
      const { collapsed, path, setDocFieldPreferences } = action

      const { collapsedRowIDs, rows } = state[path].rows.reduce(
        (acc, row) => {
          if (collapsed) acc.collapsedRowIDs.push(row.id)

          acc.rows.push({
            ...row,
            collapsed,
          })

          return acc
        },
        {
          collapsedRowIDs: [],
          rows: [],
        },
      )

      setDocFieldPreferences(path, { collapsed: collapsedRowIDs })

      return {
        ...state,
        [path]: {
          ...state[path],
          rows,
        },
      }
    }

    default: {
      return state
    }
  }
}
