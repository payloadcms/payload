import type { JsonArray, JsonObject } from '../../../types/index.js'

export const cloneDataFromOriginalDoc = (
  originalDocData: JsonArray | JsonObject,
): JsonArray | JsonObject => {
  return structuredClone(originalDocData)
}
