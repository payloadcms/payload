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
       * Set to `false` to accept server field values while preserving local row membership and order, and guarding against mismatched row IDs.
       * Callers must reject stale responses before merging.
       * When `true` or omitted, existing local field values are preserved unless the field was added by the server.
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
 * Parses an array field path to extract the array path, row index, and field path.
 * Handles nested arrays by finding the deepest numeric index.
 *
 * @param path - The field path to parse (e.g., 'array.1.text' or 'blocks.0.items.1.title')
 * @returns Object with arrayPath, rowIndex, and fieldPath, or null if not an array field
 *
 * @example
 * parseArrayFieldPath('array.1.text')
 * // Returns: { arrayPath: 'array', rowIndex: 1, fieldPath: 'text' }
 *
 * @example
 * parseArrayFieldPath('blocks.0.items.1.title')
 * // Returns: { arrayPath: 'blocks.0.items', rowIndex: 1, fieldPath: 'title' }
 */
function parseArrayFieldPath(path: string): {
  arrayPath: string
  fieldPath: string
  rowIndex: number
} | null {
  const segments = path.split('.')

  // Find the last numeric index (indicates array row)
  let lastNumericIndex = -1
  for (let i = segments.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(segments[i])) {
      lastNumericIndex = i
      break
    }
  }

  // Not an array field if no numeric index or nothing after it
  if (lastNumericIndex === -1 || lastNumericIndex === segments.length - 1) {
    return null
  }

  return {
    arrayPath: segments.slice(0, lastNumericIndex).join('.'),
    fieldPath: segments.slice(lastNumericIndex + 1).join('.'),
    rowIndex: parseInt(segments[lastNumericIndex], 10),
  }
}

/**
 * Merges a current server response into client form state.
 * Callers must reject responses invalidated by newer edits before invoking this function.
 * Existing values are preserved unless `acceptValues` requests server values.
 * Authoritative merges accept server row membership and order; other merges retain local row structure and match values by row ID.
 * Client-only field and row metadata is preserved when the server has not replaced it.
 */
export const mergeServerFormState = ({
  acceptValues,
  currentState: previousState = {},
  incomingState,
}: Args): FormState => {
  const currentState: FormState = acceptValues === true ? {} : previousState
  const newState: FormState = acceptValues === true ? {} : { ...previousState }

  // Keep local fields attached to row IDs when authoritative responses change their paths.
  if (acceptValues === true) {
    const incomingRowIndexesByPath = new Map<string, Map<string, number>>()

    for (const [path, field] of Object.entries(previousState)) {
      const segments = path.split('.')
      const incomingSegments = [...segments]
      let shouldKeepField = true

      for (let index = 1; index < segments.length; index++) {
        const segment = segments[index]
        const isRowIndex = /^\d+$/.test(segment)

        if (!isRowIndex) {
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
          incomingRowIndexes = new Map<string, number>(
            incomingRows.map((row, rowIndex) => [row.id, rowIndex]),
          )
          incomingRowIndexesByPath.set(incomingArrayPath, incomingRowIndexes)
        }

        const incomingRowIndex = incomingRowIndexes.get(currentRow.id)

        // Removed or replaced rows must not contribute fields to the next save.
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
        const incomingPath = incomingSegments.join('.')

        currentState[incomingPath] = field
        newState[incomingPath] = field
      }
    }
  }

  const shouldAcceptValues =
    acceptValues === true ||
    (typeof acceptValues === 'object' &&
      acceptValues !== null &&
      acceptValues.overrideLocalChanges === false)

  for (const [path, incomingField] of Object.entries(incomingState || {})) {
    if (!(path in previousState) && !incomingField.addedByServer) {
      continue
    }

    // Server-added fields need their values even when existing local values are being preserved.
    // Callers must reject stale responses before merging so accepted server values cannot overwrite newer local edits.
    let shouldAcceptValue = incomingField.addedByServer || shouldAcceptValues

    // Row-preserving merges must not apply values from a different row at the same index.
    // Authoritative merges have already reconciled incoming row membership above.
    if (shouldAcceptValue && !incomingField.addedByServer && acceptValues !== true) {
      const parsed = parseArrayFieldPath(path)
      if (parsed) {
        const { arrayPath, rowIndex } = parsed
        const clientRowId = currentState[arrayPath]?.rows?.[rowIndex]?.id
        const serverRowId = incomingState[arrayPath]?.rows?.[rowIndex]?.id

        if (clientRowId === undefined || (serverRowId && clientRowId !== serverRowId)) {
          shouldAcceptValue = false
        }
      }
    }

    let sanitizedIncomingField = incomingField

    if (!shouldAcceptValue) {
      // Do not delete properties from `incomingField`; this would mutate the original object.
      // Omit them via destructuring to avoid introducing unnecessary `undefined` values.
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

    // Read `currentState`, since incoming rows have already been assigned to `newState`.
    // Authoritative responses determine row membership and order.
    // Other responses preserve local row membership.
    if (Array.isArray(incomingField.rows) && path in currentState) {
      if (acceptValues === true) {
        const currentRowsByID = new Map(currentState[path].rows?.map((row) => [row.id, row]))

        // Keep metadata attached to row IDs when the server removes or reorders rows.
        newState[path].rows = incomingField.rows.map((serverRow) => ({
          ...currentRowsByID.get(serverRow.id),
          ...serverRow,
        }))
      } else {
        // Non-authoritative merges retain local membership and order.
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
            // Appending server-added rows preserves the existing local order.
            const newRow = { ...row }
            delete newRow.addedByServer
            newState[path].rows.push(newRow)
          }
        })

        // Keep the serialized row count aligned with the retained local membership.
        if ('value' in incomingField) {
          const rowCount = newState[path].rows.length

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

    // Undefined values for blocksFilterOptions coming back should be treated as "all blocks allowed" and should always be merged in.
    // Without this, an undefined value coming back will incorrectly be ignored, and the previous filter will remain.
    if (!incomingField.blocksFilterOptions) {
      delete newState[path].blocksFilterOptions
    }

    // Strip away the `addedByServer` property from the client
    // This will prevent it from being passed back to the server
    delete newState[path].addedByServer
  }

  // Return the original object reference if the state is unchanged.
  // This will avoid unnecessary re-renders and dependency updates.
  return dequal(newState, previousState) ? previousState : newState
}
