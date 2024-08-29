/**
 * If there is an incoming row id,
 * and it matches the existing sibling doc id,
 * this is an existing row, so it should be merged.
 * Otherwise, return an empty object.
 */
import type { JsonObject } from '../../../types/index.js'

export const getExistingRowDoc = (incomingRow: JsonObject, existingRows?: unknown): JsonObject => {
  if (incomingRow.id && Array.isArray(existingRows)) {
    const matchedExistingRow = existingRows.find((existingRow) => {
      if (typeof existingRow === 'object' && 'id' in existingRow) {
        if (existingRow.id === incomingRow.id) {
          return existingRow
        }
      }

      return false
    })

    if (matchedExistingRow) {
      return matchedExistingRow
    }
  }

  return {}
}
