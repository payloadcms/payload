import type { SelectType } from '../types/index.js'

/**
 * Sanitizes REST select query to SelectType
 */
export const sanitizeSelectParam = (unsanitizedSelect: unknown): SelectType | undefined => {
  if (unsanitizedSelect && typeof unsanitizedSelect === 'object') {
    for (const _k in unsanitizedSelect) {
      const k = _k as keyof typeof unsanitizedSelect
      if (unsanitizedSelect[k] === 'true') {
        ;(unsanitizedSelect as Record<string, any>)[k] = true
      } else if (unsanitizedSelect[k] === 'false') {
        ;(unsanitizedSelect as Record<string, any>)[k] = false
      } else if (typeof unsanitizedSelect[k] === 'object') {
        sanitizeSelectParam(unsanitizedSelect[k])
      }
    }
  }

  return unsanitizedSelect as SelectType
}
