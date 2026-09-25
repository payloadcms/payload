import type { JsonArray, JsonObject } from '../../../types/index.js'

export const cloneDataFromOriginalDoc = (
  originalDocData: JsonArray | JsonObject,
): JsonArray | JsonObject => {
  if (Array.isArray(originalDocData)) {
    return originalDocData.map((row) => {
      // `typeof [] === 'object'`, so an array row has to be handled before the object branch.
      // Spreading it there turns a nested array into an index-keyed object: `[1, 2]` would come
      // back as `{ 0: 1, 1: 2 }`, which silently corrupts array-of-array `json` values.
      if (Array.isArray(row)) {
        return [...row]
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
