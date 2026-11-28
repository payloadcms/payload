'use client'
import type { FormState } from 'payload'

import { dequal } from 'dequal/lite' // lite: no need for Map and Set support

type Args = {
  acceptValues?: boolean
  currentState?: FormState
  incomingState: FormState
}

/**
 * Merges server metadata while preserving existing local values and rows by default.
 * Set `acceptValues` to `true` to accept server values and row structure; callers must reject stale responses first.
 */
export const mergeServerFormState = ({
  acceptValues,
  currentState: previousState = {},
  incomingState,
}: Args): FormState => {
  const currentState: FormState = acceptValues === true ? {} : previousState

  // Keep local fields attached to row IDs when authoritative responses change their paths.
  if (acceptValues === true) {
    const incomingRowIndexesByPath = new Map<string, Map<string, number>>()

    for (const [path, field] of Object.entries(previousState)) {
      const segments = path.split('.')
      const incomingSegments = [...segments]
      let shouldKeepField = true

      for (const [index, segment] of segments.entries()) {
        if (index === 0 || !/^\d+$/.test(segment)) {
          continue
        }

        const currentArrayPath = segments.slice(0, index).join('.')
        const incomingArrayPath = incomingSegments.slice(0, index).join('.')
        const incomingRows = incomingState[incomingArrayPath]?.rows

        if (!Array.isArray(incomingRows)) {
          continue
        }

        const currentRow = previousState[currentArrayPath]?.rows?.[Number(segment)]

        if (!currentRow) {
          shouldKeepField = false
          break
        }

        let incomingRowIndexes = incomingRowIndexesByPath.get(incomingArrayPath)

        if (!incomingRowIndexes) {
          incomingRowIndexes = new Map(incomingRows.map((row, rowIndex) => [row.id, rowIndex]))
          incomingRowIndexesByPath.set(incomingArrayPath, incomingRowIndexes)
        }

        const incomingRowIndex = incomingRowIndexes.get(currentRow.id)

        if (
          incomingRowIndex === undefined ||
          incomingRows[incomingRowIndex]?.blockType !== currentRow.blockType
        ) {
          shouldKeepField = false
          break
        }

        incomingSegments[index] = String(incomingRowIndex)
      }

      if (shouldKeepField) {
        currentState[incomingSegments.join('.')] = field
      }
    }
  }

  const newState = { ...currentState }

  for (const [path, incomingField] of Object.entries(incomingState || {})) {
    if (!(path in previousState) && !incomingField.addedByServer) {
      continue
    }

    const shouldAcceptValue = incomingField.addedByServer || acceptValues === true

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

    if (acceptValues === true && incomingField.passesCondition === false) {
      delete newState[path].customComponents
      delete newState[path].lastRenderedPath
    }

    if (
      currentState[path] &&
      'errorPaths' in currentState[path] &&
      !('errorPaths' in incomingField)
    ) {
      newState[path].errorPaths = []
    }

    // Metadata refreshes preserve local row structure; authoritative merges accept server rows.
    if (Array.isArray(incomingField.rows) && path in currentState) {
      if (acceptValues === true) {
        const currentRowsByID = new Map(currentState[path]?.rows?.map((row) => [row.id, row]))

        newState[path].rows = incomingField.rows.map((serverRow) => {
          const currentRow = currentRowsByID.get(serverRow.id)

          return {
            ...currentRow,
            ...serverRow,
            // A moved nested row may receive the server's collapse default for its new path.
            ...(typeof currentRow?.collapsed === 'boolean'
              ? { collapsed: currentRow.collapsed }
              : {}),
          }
        })
      } else {
        // Match metadata to local rows by ID.
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

      // Client rows may have changed while the request was pending.
      // Metadata refreshes preserve their row count and null/empty distinction; authoritative merges accept server values.
      if ('value' in incomingField) {
        const rowCount = newState[path].rows.length

        if (acceptValues !== true) {
          newState[path].value =
            rowCount === 0 && currentState[path]?.value === null ? null : rowCount
        }
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
  return dequal(newState, previousState) ? previousState : newState
}
