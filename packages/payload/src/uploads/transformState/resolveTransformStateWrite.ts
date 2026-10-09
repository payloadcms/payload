import { isDeepStrictEqual } from 'node:util'

import type { Document } from '../../types/index.js'

/** Resolve complete replacement before field hooks or generic deep merges obscure omission. */
export function resolveTransformStateWrite({
  data,
  isReplacingOriginal = false,
  originalDoc,
}: {
  data: Document
  isReplacingOriginal?: boolean
  originalDoc?: Document
}): { hasChanged: boolean; shouldValidate: boolean; value: unknown } {
  const isSubmitted = Object.prototype.hasOwnProperty.call(data, '_transforms')
  const priorValue = originalDoc?._transforms ?? null
  const candidate = isSubmitted ? data._transforms : isReplacingOriginal ? null : priorValue
  const value =
    candidate &&
    typeof candidate === 'object' &&
    !Array.isArray(candidate) &&
    (Object.getPrototypeOf(candidate) === Object.prototype ||
      Object.getPrototypeOf(candidate) === null) &&
    Object.keys(candidate).length === 0
      ? null
      : candidate

  return {
    hasChanged: !isDeepStrictEqual(priorValue, value),
    shouldValidate: isSubmitted || isReplacingOriginal,
    value,
  }
}
