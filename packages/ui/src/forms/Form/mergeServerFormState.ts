'use client'
import type { FormState } from '@ruya.sa/payload'

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
 * Note: Local state is the source of truth, not the new server state that is getting merged in. This is critical for array row
 * manipulation specifically, where the user may have added, removed, or reordered rows while a request was pending and is now stale.
 *
 * This function applies some defaults, as well as cleans up the server response in preparation for the client.
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
    const shouldAcceptValue =
      incomingField.addedByServer ||
      acceptValues === true ||
      (typeof acceptValues === 'object' &&
        acceptValues !== null &&
        // Note: Must be explicitly `false`, allow `null` or `undefined` to mean true
        acceptValues.overrideLocalChanges === false &&
        !currentState[path]?.isModified)

    let sanitizedIncomingField = incomingField

    if (!shouldAcceptValue) {
      /**
       * Note: do not delete properties off `incomingField` as this will mutate the original object
       * Instead, omit them from the destructured object by excluding specific keys
       * This will also ensure we don't set `undefined` into the result unnecessarily
       */
      const { initialValue, value, ...rest } = incomingField
      sanitizedIncomingField = rest
    }

    newState[path] = {
      ...currentState[path],
      ...sanitizedIncomingField,
    }

    if (
      currentState[path] &&
      'errorPaths' in currentState[path] &&
      !('errorPaths' in incomingField)
    ) {
      newState[path].errorPaths = []
    }

    /**
     * Deeply merge the rows array to ensure changes to local state are not lost while the request was pending
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
        } else if (row.addedByServer) {
          /**
           * Note: This is a known limitation of computed array and block rows
           * If a new row was added by the server, we append it to the _end_ of this array
           * This is because the client is the source of truth, and it has arrays ordered in a certain position
           * For example, the user may have re-ordered rows client-side while a long running request is processing
           * This means that we _cannot_ slice a new row into the second position on the server, for example
           * By the time it gets back to the client, its index is stale
           */
          const newRow = { ...row }
          delete newRow.addedByServer
          newState[path].rows.push(newRow)
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

    /**
     * Undefined values for blocksFilterOptions coming back should be treated as "all blocks allowed" and
     * should always be merged in.
     * Without this, an undefined value coming back will incorrectly be ignored, and the previous filter will remain.
     */
    if (!incomingField.blocksFilterOptions) {
      delete newState[path].blocksFilterOptions
    }

    // Strip away the `addedByServer` property from the client
    // This will prevent it from being passed back to the server
    delete newState[path].addedByServer
  }

  // Return the original object reference if the state is unchanged
  // This will avoid unnecessary re-renders and dependency updates
  return dequal(newState, currentState) ? currentState : newState
}
