import type { PopulateType } from 'payload'

import { sanitizeSelect } from './sanitizeSelect.js'

export const sanitizePopulate = (unsanitizedPopulate: unknown): PopulateType | undefined => {
  if (!unsanitizedPopulate || typeof unsanitizedPopulate !== 'object') {
    return
  }

  for (const k in unsanitizedPopulate) {
    unsanitizedPopulate[k] = sanitizeSelect(unsanitizedPopulate[k])
  }

  return unsanitizedPopulate as PopulateType
}
