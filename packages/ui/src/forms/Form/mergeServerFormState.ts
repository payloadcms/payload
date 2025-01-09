'use client'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { type FormState } from 'payload'

import { mergeErrorPaths } from './mergeErrorPaths.js'

type Args = {
  acceptValues?: boolean
  existingState: FormState
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
  existingState,
  incomingState,
}: Args): { changed: boolean; newState: FormState } => {
  const serverPropsToAccept = [
    'passesCondition',
    'valid',
    'errorMessage',
    'rows',
    'customComponents',
    'requiresRender',
  ]

  if (acceptValues) {
    serverPropsToAccept.push('value')
  }

  let changed = false

  const newState = {}

  if (existingState) {
    Object.entries(existingState).forEach(([path, newFieldState]) => {
      if (!incomingState[path]) {
        return
      }

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
       * Handle filterOptions
       */
      if (incomingState[path]?.filterOptions || newFieldState.filterOptions) {
        if (!dequal(incomingState[path]?.filterOptions, newFieldState.filterOptions)) {
          changed = true
          newFieldState.filterOptions = incomingState[path].filterOptions
        }
      }

      /**
       * Handle adding all the remaining props that should be updated in the local form state from the server form state
       */
      serverPropsToAccept.forEach((prop) => {
        if (!dequal(incomingState[path]?.[prop], newFieldState[prop])) {
          changed = true
          if (!(prop in incomingState[path])) {
            // Regarding excluding the customComponents prop from being deleted: the incoming state might not have been rendered, as rendering components for every form onchange is expensive.
            // Thus, we simply re-use the initial render state
            if (prop !== 'customComponents') {
              delete newFieldState[prop]
            }
          } else {
            newFieldState[prop] = incomingState[path][prop]
          }
        }
      })

      // Conditions don't work if we don't memcopy the new state, as the object references would otherwise be the same
      newState[path] = { ...newFieldState }
    })

    // Now loop over values that are part of incoming state but not part of existing state, and add them to the new state.
    // This can happen if a new array row was added. In our local state, we simply add out stubbed `array` and `array.[index].id` entries to the local form state.
    // However, all other array sub-fields are not added to the local state - those will be added by the server and may be incoming here.

    for (const [path, newFieldState] of Object.entries(incomingState)) {
      if (!existingState[path]) {
        changed = true
        newState[path] = newFieldState
      }
    }
  }

  return { changed, newState }
}
