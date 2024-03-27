import type { FormState } from 'payload/types'

import { mergeErrorPaths } from './mergeErrorPaths.js'

const serverPropsToAccept = ['passesCondition', 'valid', 'errorMessage']

/**
 * Merges certain properties from the server state into the client state. These do not include values,
 * as we do not want to update them on the client like that, which would cause flickering.
 *
 * We want to use this to update the error state, and other properties that are not user input, as the error state
 * is the thing we want to keep in sync with the server (where it's calculated) on the client.
 */
export const mergeServerFormState = (
  existingState: FormState,
  incomingState: FormState,
): { changed: boolean; newState: FormState } => {
  let changed = false

  const newState = {}

  if (existingState) {
    Object.entries(existingState).forEach(([path, newFieldState]) => {
      if (!incomingState[path]) return

      /**
       * Handle error paths
       */

      const errorPathsResult = mergeErrorPaths(
        newFieldState.errorPaths,
        incomingState[path].errorPaths as unknown as string[],
      )
      if (errorPathsResult.result) {
        if (errorPathsResult.changed) {
          changed = errorPathsResult.changed
        }
        newFieldState.errorPaths = errorPathsResult.result
      }

      /**
       * Handle the rest which is in serverPropsToAccept
       */
      serverPropsToAccept.forEach((prop) => {
        if (incomingState[path]?.[prop] !== newFieldState[prop]) {
          changed = true
          if (!(prop in incomingState[path])) {
            delete newFieldState[prop]
          } else {
            newFieldState[prop] = incomingState[path][prop]
          }
        }
      })

      /**
       * Handle rows
       */
      if (Array.isArray(newFieldState.rows) && newFieldState?.rows.length) {
        let i = 0
        for (const row of newFieldState.rows) {
          const incomingRow = incomingState[path]?.rows?.[i]
          if (incomingRow) {
            const errorPathsRowResult = mergeErrorPaths(
              row.errorPaths,
              incomingRow.errorPaths as unknown as string[],
            )
            if (errorPathsRowResult.result) {
              if (errorPathsResult.changed) {
                changed = true
              }
              incomingRow.errorPaths = errorPathsRowResult.result
            }
          }

          i++
        }
      }

      // Conditions don't work if we don't memcopy the new state, as the object references would otherwise be the same
      newState[path] = { ...newFieldState }
    })
  }

  return { changed, newState }
}
