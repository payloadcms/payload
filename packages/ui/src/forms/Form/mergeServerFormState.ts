'use client'
import type { FormState } from 'payload'

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

  const newState = { ...(currentState || {}) }

  for (const [path, incomingField] of Object.entries(incomingState || {})) {
    if (!(path in currentState)) {
      continue
    }

    if (!acceptValues) {
      delete incomingField.value
      delete incomingField.initialValue
    }

    newState[path] = {
      ...currentState[path],
      ...incomingField,
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
     * Note: read `currentState` and not `newState` here, as the `rows` property have already been merged above
     */
    if (Array.isArray(incomingField.rows) && path in currentState) {
      newState[path].rows = [...(currentState[path]?.rows || [])] // shallow copy to avoid mutating the original array

      incomingField.rows.forEach((row) => {
        const indexInCurrentState = currentState[path].rows.findIndex(
          (existingRow) => existingRow.id === row.id,
        )

        if (indexInCurrentState > -1) {
          changed = true

          newState[path].rows[indexInCurrentState] = {
            ...currentState[path].rows[indexInCurrentState],
            ...row,
          }
        }
      })
    }

    // Ensure that all top-level fields that correspond to each row are present
    // This is because we skipped over these fields since they were not originally a part of local state
    // However, the server may have added them, therefore, we need to add them to the new state
    if (Array.isArray(newState[path]?.rows)) {
      newState[path].rows.forEach((row, index) => {
        const fieldPathPrefix = `${path}.${index}`
        // Find all rows within incoming state that begin with the same prefix
        for (const [path, incomingField] of Object.entries(incomingState || {})) {
          if (path.startsWith(fieldPathPrefix)) {
            // If its not yet in the new state, add it
            if (!newState[path]) {
              newState[path] = incomingField
              newState[path].passesCondition = newState[path].passesCondition ?? true
              newState[path].valid = newState[path].valid ?? true
            }
          }
        }
      })
    }

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
