// @ts-strict-ignore
import type { PopulateType } from '../types/index.js'

import { sanitizeSelectParam } from './sanitizeSelectParam.js'

/**
 * Sanitizes REST populate query to PopulateType
 */
export const sanitizePopulateParam = (unsanitizedPopulate: unknown): PopulateType | undefined => {
  if (!unsanitizedPopulate || typeof unsanitizedPopulate !== 'object') {
    return
  }

  for (const k in unsanitizedPopulate) {
    unsanitizedPopulate[k] = sanitizeSelectParam(unsanitizedPopulate[k])
  }

  return unsanitizedPopulate as PopulateType
}
