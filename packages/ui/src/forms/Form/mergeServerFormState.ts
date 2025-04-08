'use client'
import type { FieldState, FormState } from 'payload'

import { dequal } from 'dequal/lite' // lite: no need for Map and Set support

import { mergeErrorPaths } from './mergeErrorPaths.js'

type Args = {
  acceptValues?: boolean
  currentState: FormState
  incomingState: FormState
}

/**
 * This function receives form state from the server and intelligently merges it into the client state.
 * The server contains extra properties that the client may not have, e.g. custom components and error states.
 * We typically do not want to merge properties that rely on user input, however, such as values, unless explicitly requested.
 * Doing this would cause the client to lose any local changes to those fields.
 */
export const mergeServerFormState = ({
  acceptValues,
  currentState,
  incomingState,
}: Args): { changed: boolean; newState: FormState } => {
  let changed = false

  const newState = { ...currentState }

  const serverPropsToAccept: Array<keyof FieldState> = [
    'passesCondition',
    'valid',
    'errorMessage',
    'errorPaths',
    'customComponents',
  ]

  if (acceptValues) {
    serverPropsToAccept.push('value')
    serverPropsToAccept.push('initialValue')
  }

  for (const [path, incomingField] of Object.entries(incomingState)) {
    newState[path] = {
      ...(newState?.[path] || {}),
    }

    /**
     * Handle error paths
     */
    const errorPathsResult = mergeErrorPaths(
      newState[path]?.errorPaths,
      incomingField.errorPaths as unknown as string[],
    )

    if (errorPathsResult.result) {
      if (errorPathsResult.changed) {
        changed = errorPathsResult.changed
      }

      newState[path].errorPaths = errorPathsResult.result
    }

    /**
     * Handle filterOptions
     */
    if (incomingField.filterOptions || newState[path].filterOptions) {
      if (!dequal(incomingField?.filterOptions, newState[path].filterOptions)) {
        changed = true
        newState[path].filterOptions = incomingField.filterOptions
      }
    }

    /**
     * Intelligently merge the rows array to ensure changes to local state are not lost while the request was pending
     * For example, the server response could come back with a row which has been deleted on the client
     * Loop over the incoming rows, if it exists in client side form state, merge in any new properties from the server
     */
    if (Array.isArray(incomingField.rows)) {
      incomingField.rows.forEach((row) => {
        const matchedExistingRowIndex = newState[path].rows.findIndex(
          (existingRow) => existingRow.id === row.id,
        )

        if (matchedExistingRowIndex > -1) {
          changed = true
          newState[path].rows = [...newState[path].rows] // shallow copy to avoid mutating the original array

          newState[path].rows[matchedExistingRowIndex] = {
            ...newState[path].rows[matchedExistingRowIndex],
            ...row,
          }
        }
      })
    }

    /**
     * Handle all remaining properties
     */
    serverPropsToAccept.forEach((propFromServer) => {
      if (!dequal(incomingField[propFromServer], newState[path][propFromServer])) {
        changed = true

        if (propFromServer in incomingField) {
          newState[path][propFromServer as any] = incomingField[propFromServer]
        }
      }
    })

    // Mark undefined as valid
    if (newState[path].valid !== false) {
      newState[path].valid = true
    }

    // Mark undefined as passesCondition
    if (newState[path].passesCondition !== false) {
      newState[path].passesCondition = true
    }
  }

  return { changed, newState }
}
