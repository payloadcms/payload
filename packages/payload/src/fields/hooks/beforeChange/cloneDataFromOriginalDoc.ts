import type { JsonArray, JsonObject } from '../../../types/index.js'

export const cloneDataFromOriginalDoc = (
  originalDocData: JsonArray | JsonObject,
): JsonArray | JsonObject => {
  if (Array.isArray(originalDocData)) {
    return originalDocData.map((row) => {
      // Recurse for nested arrays so they stay arrays instead of being
      // spread into index-keyed objects (`{...[1, 2]}` -> `{ 0: 1, 1: 2 }`).
      if (Array.isArray(row)) {
        return cloneDataFromOriginalDoc(row)
      }

      if (typeof row === 'object' && row != null) {
        return {
          ...row,
        }
      }

      return row
    })
  }

  if (typeof originalDocData === 'object' && originalDocData !== null) {
    return { ...originalDocData }
  }

  return originalDocData
}
