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
 * Merges certain properties from the server state into the client state. These do not include values,
 * as we do not want to update them on the client like that, which would cause flickering.
 *
 * We want to use this to update the error state, and other properties that are not user input, as the error state
 * is the thing we want to keep in sync with the server (where it's calculated) on the client.
 */
export const mergeServerFormState = ({
  acceptValues,
  currentState,
  incomingState,
}: Args): { changed: boolean; newState: FormState } => {
  let changed = false

  const newState = {}

  if (currentState) {
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

    for (const [path, field] of Object.entries(currentState)) {
      const fieldState = { ...field }

      if (!incomingState[path]) {
        continue
      }

      /**
       * Handle error paths
       */
      const errorPathsResult = mergeErrorPaths(
        fieldState.errorPaths,
        incomingState[path].errorPaths as unknown as string[],
      )

      if (errorPathsResult.result) {
        if (errorPathsResult.changed) {
          changed = errorPathsResult.changed
        }

        fieldState.errorPaths = errorPathsResult.result
      }

      /**
       * Handle filterOptions
       */
      if (incomingState[path]?.filterOptions || fieldState.filterOptions) {
        if (!dequal(incomingState[path]?.filterOptions, fieldState.filterOptions)) {
          changed = true
          fieldState.filterOptions = incomingState[path].filterOptions
        }
      }

      /**
       * Need to intelligently merge the rows array to ensure changes to local state are not lost while the request was pending
       * For example, the server response could come back with a row which has been deleted on the client
       * Loop over the incoming rows, if it exists in client side form state, merge in any new properties from the server
       */
      if (Array.isArray(incomingState[path].rows)) {
        incomingState[path].rows.forEach((row) => {
          const matchedExistingRowIndex = fieldState.rows.findIndex(
            (existingRow) => existingRow.id === row.id,
          )

          if (matchedExistingRowIndex > -1) {
            changed = true
            fieldState.rows = [...fieldState.rows] // shallow copy to avoid mutating the original array

            fieldState.rows[matchedExistingRowIndex] = {
              ...fieldState.rows[matchedExistingRowIndex],
              ...row,
            }
          }
        })
      }

      /**
       * Handle adding all the remaining props that should be updated in the local form state from the server form state
       */
      serverPropsToAccept.forEach((propFromServer) => {
        if (!dequal(incomingState[path]?.[propFromServer], fieldState[propFromServer])) {
          changed = true

          if (!(propFromServer in incomingState[path])) {
            // Regarding excluding the customComponents prop from being deleted: the incoming state might not have been rendered, as rendering components for every form onchange is expensive.
            // Thus, we simply re-use the initial render state
            if (propFromServer !== 'customComponents') {
              delete fieldState[propFromServer]
            }
          } else {
            fieldState[propFromServer as any] = incomingState[path][propFromServer]
          }
        }
      })

      if (fieldState.valid !== false) {
        fieldState.valid = true
      }

      if (fieldState.passesCondition !== false) {
        fieldState.passesCondition = true
      }

      newState[path] = fieldState
    }

    // Now loop over values that are part of incoming state but not part of existing state, and add them to the new state.
    // This can happen if a new array row was added. In our local state, we simply add out stubbed `array` and `array.[index].id` entries to the local form state.
    // However, all other array sub-fields are not added to the local state - those will be added by the server and may be incoming here.
    for (const [path, field] of Object.entries(incomingState)) {
      if (!currentState[path]) {
        changed = true
        newState[path] = field
      }
    }
  }

  return { changed, newState }
}
