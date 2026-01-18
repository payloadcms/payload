'use client'
import type { FormField, FormState, Row } from '@ruya.sa/payload'

import ObjectIdImport from 'bson-objectid'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { deepCopyObjectSimpleWithoutReactComponents } from '@ruya.sa/payload/shared'

import type { FieldAction } from './types.js'

import { mergeServerFormState } from './mergeServerFormState.js'
import { flattenRows, separateRows } from './rows.js'

const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport

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
        isLoading: true,
      }

      if (blockType) {
        newRow.blockType = blockType
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
          valid: true,
          value: newRow.id,
        },
        [path]: {
          ...state[path],
          disableFormData: true,
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

    /**
     * Duplicates a row in an array or blocks field.
     * It needs to manipulate two distinct parts of the form state:
     *   - The `rows` property of the parent field, e.g. `array.rows`, `blocks.rows`, etc.
     *   - The row's state, e.g. `array.0.id`, `array.0.text`, etc.
     */
    case 'DUPLICATE_ROW': {
      const { path, rowIndex } = action
      const { remainingFields, rows } = separateRows(path, state)

      // 1. Duplicate the `rows` property of the parent field, e.g. `array.rows`, `blocks.rows`, etc.
      const newRows = [...(state[path].rows || [])]

      const newRow = deepCopyObjectSimpleWithoutReactComponents(newRows[rowIndex])

      const newRowID = new ObjectId().toHexString()

      if (newRow.id) {
        newRow.id = newRowID
      }

      if (newRows[rowIndex]?.customComponents?.RowLabel) {
        newRow.customComponents = {
          RowLabel: newRows[rowIndex].customComponents.RowLabel,
        }
      }

      // 2. Duplicate the row's state, e.g. `array.0.id`, `array.0.text`, etc.
      const newRowState = deepCopyObjectSimpleWithoutReactComponents(rows[rowIndex])

      // Ensure that `id` in form state exactly matches the row id on the parent field
      if (newRowState.id) {
        newRowState.id.value = newRowID
        newRowState.id.initialValue = newRowID
      }

      // Generate new ids for all nested id fields, e.g. `array.0.nestedArray.0.id`
      for (const key of Object.keys(newRowState).filter((key) => key.endsWith('.id'))) {
        const idState = newRowState[key]

        const newNestedFieldID = new ObjectId().toHexString()

        if (idState && typeof idState.value === 'string' && ObjectId.isValid(idState.value)) {
          newRowState[key].value = newNestedFieldID
          newRowState[key].initialValue = newNestedFieldID

          // Apply the ID to its corresponding parent field's rows, e.g. `array.0.nestedArray.rows[0].id`
          const segments = key.split('.')
          const rowIndex = parseInt(segments[segments.length - 2], 10)
          const parentFieldPath = segments.slice(0, segments.length - 2).join('.')
          const parentFieldRows = newRowState?.[parentFieldPath]?.rows

          if (newRowState[parentFieldPath] && Array.isArray(parentFieldRows)) {
            if (!parentFieldRows[rowIndex]) {
              parentFieldRows[rowIndex] = {
                id: newNestedFieldID,
              }
            } else {
              parentFieldRows[rowIndex].id = newNestedFieldID
            }
          }
        }
      }

      // If there are subfields
      if (Object.keys(newRowState).length > 0) {
        // Add new object containing subfield names to unflattenedRows array
        rows.splice(rowIndex + 1, 0, newRowState)
        newRows.splice(rowIndex + 1, 0, newRow)
      }

      const newState = {
        ...remainingFields,
        ...flattenRows(path, rows),
        [path]: {
          ...state[path],
          disableFormData: true,
          rows: newRows,
          value: rows.length,
        },
      }

      return newState
    }

    case 'MERGE_SERVER_STATE': {
      const { acceptValues, prevStateRef, serverState } = action

      const newState = mergeServerFormState({
        acceptValues,
        currentState: state || {},
        incomingState: serverState,
      })

      prevStateRef.current = newState

      return newState
    }

    case 'MOVE_ROW': {
      const { moveFromIndex, moveToIndex, path } = action

      // Handle moving rows on the top-level, i.e. `array.0.text` -> `array.1.text`
      const { remainingFields, rows: topLevelRows } = separateRows(path, state)
      const copyOfMovingRow = topLevelRows[moveFromIndex]
      topLevelRows.splice(moveFromIndex, 1)
      topLevelRows.splice(moveToIndex, 0, copyOfMovingRow)

      // modify array/block internal row state (i.e. collapsed, blockType)
      const rowsWithinField = [...(state[path]?.rows || [])]
      const copyOfMovingRow2 = { ...rowsWithinField[moveFromIndex] }
      rowsWithinField.splice(moveFromIndex, 1)
      rowsWithinField.splice(moveToIndex, 0, copyOfMovingRow2)

      const newState = {
        ...remainingFields,
        ...flattenRows(path, topLevelRows),
        [path]: {
          ...state[path],
          rows: rowsWithinField,
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
              ...(key === 'value' ? { isModified: true } : {}),
            }
          }

          return field
        },
        state?.[action.path] || ({} as FormField),
      )

      const newState = {
        ...state,
        [action.path]: newField,
      }

      // reset `isModified` in all other fields
      if ('value' in action) {
        for (const [path, field] of Object.entries(newState)) {
          if (path !== action.path && 'isModified' in field) {
            delete newState[path].isModified
          }
        }
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
