import type { JsonArray, JsonObject } from '../../../types/index.js'

import { deepCopyObjectSimple } from '../../../utilities/deepCopyObject.js'

export const cloneDataFromOriginalDoc = (
  originalDocData: JsonArray | JsonObject,
): JsonArray | JsonObject => {
  return deepCopyObjectSimple(originalDocData)
}
