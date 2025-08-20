'use client'
import type { FormState } from 'payload'

import { dequal } from 'dequal/lite' // lite: no need for Map and Set support

/**
 * If true, will accept all values from the server, overriding any current values in local state.
 * Can also provide an options object for more granular control.
 */
export type AcceptValues =
  | {
      /**
       * When `false`, will accept the values from the server _UNLESS_ the value has been modified locally since the request was made.
       * This is useful for autosave, for example, where hooks may have modified the field's value on the server while you were still making changes.
       * @default undefined
       */
      overrideLocalChanges?: boolean
    }
  | boolean

type Args = {
  acceptValues?: AcceptValues
  currentState?: FormState
  incomingState: FormState
}

/**
 * This function receives form state from the server and intelligently merges it into the client state.
 * The server contains extra properties that the client may not have, e.g. custom components and error states.
 * We typically do not want to merge properties that rely on user input, however, such as values, unless explicitly requested.
 * Doing this would cause the client to lose any local changes to those fields.
 *
 * This function will also a few defaults, as well as clean up the server response in preparation for the client.
 * e.g. it will set `valid` and `passesCondition` to true if undefined, and remove `addedByServer` from the response.
 */
export const mergeServerFormState = ({
  acceptValues,
  currentState = {},
  incomingState,
}: Args): FormState => {
  const newState = { ...currentState }

  for (const [path, incomingField] of Object.entries(incomingState || {})) {
    if (!(path in currentState) && !incomingField.addedByServer) {
      continue
    }

    /**
     * If it's a new field added by the server, always accept the value.
     * Otherwise:
     *   a. accept all values when explicitly requested, e.g. on submit
     *   b. only accept values for unmodified fields, e.g. on autosave
     */
    if (
      !incomingField.addedByServer &&
      (!acceptValues ||
        // See `acceptValues` type definition for more details
        (typeof acceptValues === 'object' &&
          acceptValues !== null &&
          acceptValues?.overrideLocalChanges === false &&
          currentState[path].isModified))
    ) {
      delete incomingField.value
      delete incomingField.initialValue
    }

    newState[path] = {
      ...currentState[path],
      ...incomingField,
    }

    if (
      currentState[path] &&
      'errorPaths' in currentState[path] &&
      !('errorPaths' in incomingField)
    ) {
      newState[path].errorPaths = []
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
        const indexInCurrentState = currentState[path].rows?.findIndex(
          (existingRow) => existingRow.id === row.id,
        )

        if (indexInCurrentState > -1) {
          newState[path].rows[indexInCurrentState] = {
            ...currentState[path].rows[indexInCurrentState],
            ...row,
          }
        }
      })
    }

    // If `valid` is `undefined`, mark it as `true`
    if (incomingField.valid !== false) {
      newState[path].valid = true
    }

    // If `passesCondition` is `undefined`, mark it as `true`
    if (incomingField.passesCondition !== false) {
      newState[path].passesCondition = true
    }

    // Strip away the `addedByServer` property from the client
    // This will prevent it from being passed back to the server
    delete newState[path].addedByServer
  }

  // Return the original object reference if the state is unchanged
  // This will avoid unnecessary re-renders and dependency updates
  return dequal(newState, currentState) ? currentState : newState
}
