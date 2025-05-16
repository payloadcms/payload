// @ts-strict-ignore
import type { SelectType } from '../types/index.js'

/**
 * Sanitizes REST select query to SelectType
 */
export const sanitizeSelectParam = (unsanitizedSelect: unknown): SelectType | undefined => {
  if (unsanitizedSelect && typeof unsanitizedSelect === 'object') {
    for (const k in unsanitizedSelect) {
      if (unsanitizedSelect[k] === 'true') {
        unsanitizedSelect[k] = true
      } else if (unsanitizedSelect[k] === 'false') {
        unsanitizedSelect[k] = false
      } else if (typeof unsanitizedSelect[k] === 'object') {
        sanitizeSelectParam(unsanitizedSelect[k])
      }
    }
  }

  return unsanitizedSelect as SelectType
}
