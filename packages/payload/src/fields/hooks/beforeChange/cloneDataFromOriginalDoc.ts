import type { JsonArray, JsonObject } from '../../../types/index.js'

/**
 * Returns a deep copy of `originalDocData` so that callers can freely mutate
 * the clone (e.g. `delete siblingData[field.name]`) without affecting the
 * original document object in memory.
 *
 * The previous implementation used `{ ...row }` (a shallow spread) for each
 * element of an array, which only separated the top-level row object from the
 * original. Any nested object or array inside the row was still the **same**
 * reference. When `beforeValidate/promise.ts` later ran
 * `delete siblingData[field.name]` on a nested field inside such a shared
 * sub-object, it silently mutated the original document. The subsequent
 * `getFallbackValue` call therefore saw `undefined` instead of the stored DB
 * value and fell through to `defaultValue`, resetting the field.
 *
 * `structuredClone` produces a fully independent deep copy in a single call,
 * eliminating the entire class of aliasing bugs regardless of nesting depth.
 *
 * @see https://github.com/payloadcms/payload/issues/18415
 * @see https://github.com/payloadcms/payload/issues/17475
 */
export const cloneDataFromOriginalDoc = (
  originalDocData: JsonArray | JsonObject,
): JsonArray | JsonObject => structuredClone(originalDocData)
