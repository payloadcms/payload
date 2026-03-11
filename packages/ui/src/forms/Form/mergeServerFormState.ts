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

  /**
   * Pre-compute row ID maps for all array/block fields with rows.
   * This allows us to detect when a row has been moved or deleted on the client
   * while a request was in-flight, so that flattened row fields (e.g. `array.1.text`)
   * are not overwritten with stale server data from a different row at the same index.
   */
  const serverRowIdAtIndex = new Map<string, Map<number, string>>() // arrayPath -> (serverIndex -> rowId)
  const clientRowIdAtIndex = new Map<string, Map<number, string>>() // arrayPath -> (clientIndex -> rowId)

  for (const [path, incomingField] of Object.entries(incomingState || {})) {
    if (Array.isArray(incomingField.rows) && path in currentState) {
      const serverMap = new Map<number, string>()
      incomingField.rows.forEach((row, i) => serverMap.set(i, row.id))
      serverRowIdAtIndex.set(path, serverMap)

      const clientMap = new Map<number, string>()
      ;(currentState[path]?.rows || []).forEach((row, i) => clientMap.set(i, row.id))
      clientRowIdAtIndex.set(path, clientMap)
    }
  }

  for (const [path, incomingField] of Object.entries(incomingState || {})) {
    if (!(path in currentState) && !incomingField.addedByServer) {
      continue
    }

    /**
     * Check if this is a flattened row field (e.g. `array.1.text`) whose row index on the server
     * points to a different row than the same index on the client. This can happen when the user
     * reorders or deletes rows while an autosave request is in-flight: the server responds with
     * stale index-based data that no longer corresponds to the client's row order.
     * In that case, do not accept the server's value to avoid overwriting the correct local data.
     */
    let rowIndexMismatch = false
    if (
      typeof acceptValues === 'object' &&
      acceptValues !== null &&
      acceptValues.overrideLocalChanges === false
    ) {
      for (const [arrayPath, serverMap] of serverRowIdAtIndex) {
        if (path.startsWith(`${arrayPath}.`)) {
          const remainder = path.slice(arrayPath.length + 1)
          const dotIdx = remainder.indexOf('.')
          if (dotIdx > -1) {
            const idx = parseInt(remainder.slice(0, dotIdx), 10)
            if (!isNaN(idx)) {
              const serverRowId = serverMap.get(idx)
              const clientRowId = clientRowIdAtIndex.get(arrayPath)?.get(idx)
              if (serverRowId !== clientRowId) {
                rowIndexMismatch = true
              }
            }
          }
          break
        }
      }
    }

    /**
     * If it's a new field added by the server, always accept the value.
     * Otherwise:
     *   a. accept all values when explicitly requested, e.g. on submit
     *   b. only accept values for unmodified fields, e.g. on autosave
     *      — but not when the row at this index has changed (reorder/delete race condition)
     */
    const shouldAcceptValue =
      incomingField.addedByServer ||
      acceptValues === true ||
      (typeof acceptValues === 'object' &&
        acceptValues !== null &&
        // Note: Must be explicitly `false`, allow `null` or `undefined` to mean true
        acceptValues.overrideLocalChanges === false &&
        !rowIndexMismatch &&
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

      /**
       * Ensure the `value` (row count) always reflects the actual number of rows after the merger.
       * When the server sends a `value` that differs from the corrected rows count (e.g. because
       * rows were deleted on the client while the request was in-flight), override it with the
       * actual count to keep `value` in sync with `rows.length`.
       */
      if ('value' in incomingField) {
        newState[path].value = newState[path].rows.length
      }
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
