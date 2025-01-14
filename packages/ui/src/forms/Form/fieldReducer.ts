'use client'
import type { FormField, FormState, Row } from 'payload'

import ObjectIdImport from 'bson-objectid'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { deepCopyObjectSimple, deepCopyObjectSimpleWithoutReactComponents } from 'payload/shared'

import type { FieldAction } from './types.js'

import { flattenRows, separateRows } from './rows.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

/**
 * Reducer which modifies the form field state (all the current data of the fields in the form). When called using dispatch, it will return a new state object.
 */
export function fieldReducer(state: FormState, action: FieldAction): FormState {
  switch (action.type) {
    case 'ADD_ROW': {
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

    case 'ADD_SERVER_ERRORS': {
      let newState = { ...state }

      const errorPaths: { fieldErrorPath: string; parentPath: string }[] = []

      action.errors.forEach(({ message, path: fieldPath }) => {
        newState[fieldPath] = {
          ...(newState[fieldPath] || {
            initialValue: null,
            value: null,
          }),
          errorMessage: message,
          valid: false,
        }

        const segments = fieldPath.split('.')
        if (segments.length > 1) {
          errorPaths.push({
            fieldErrorPath: fieldPath,
            parentPath: segments.slice(0, segments.length - 1).join('.'),
          })
        }
      })

      newState = Object.entries(newState).reduce((acc, [path, fieldState]) => {
        const fieldErrorPaths = errorPaths.reduce((errorACC, { fieldErrorPath, parentPath }) => {
          if (parentPath.startsWith(path)) {
            errorACC.push(fieldErrorPath)
          }
          return errorACC
        }, [])

        let changed = false

        if (fieldErrorPaths.length > 0) {
          const newErrorPaths = Array.isArray(fieldState.errorPaths) ? fieldState.errorPaths : []

          fieldErrorPaths.forEach((fieldErrorPath) => {
            if (!newErrorPaths.includes(fieldErrorPath)) {
              newErrorPaths.push(fieldErrorPath)
              changed = true
            }
          })

          if (changed) {
            acc[path] = {
              ...fieldState,
              errorPaths: newErrorPaths,
            }
          }
        }

        if (!changed) {
          acc[path] = fieldState
        }

        return acc
      }, {})

      return newState
    }

    case 'DUPLICATE_ROW': {
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
          requiresRender: true,
          rows: rowStateCopy,
        },
      }

      return newState
    }

    case 'REMOVE': {
      const newState = { ...state }
      if (newState[action.path]) {
        delete newState[action.path]
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
          requiresRender: true,
          rows: rowsMetadata,
          value: rows.length,
        },
        ...flattenRows(path, rows),
      }

      return newState
    }

    case 'REPLACE_ROW': {
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

    case 'REPLACE_STATE': {
      if (action.optimize !== false) {
        // Only update fields that have changed
        // by comparing old value / initialValue to new
        // ..
        // This is a performance enhancement for saving
        // large documents with hundreds of fields
        const newState = {}

        Object.entries(action.state).forEach(([path, field]) => {
          const oldField = state[path]
          const newField = field

          if (!dequal(oldField, newField)) {
            newState[path] = newField
          } else if (oldField) {
            newState[path] = oldField
          }
        })
        return newState
      }
      // If we're not optimizing, just set the state to the new state
      return action.state
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
