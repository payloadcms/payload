import type { SanitizedConfig } from '../config/types.js'

type PayloadError = {
  isPublic?: boolean
  status?: number
} & Error

/**
 * Determines if an error should be shown to the user.
 */
export function isErrorPublic(error: Error, config: SanitizedConfig) {
  if (config.debug) {
    return true
  }

  if ((error as PayloadError).isPublic === true) {
    return true
  }

  return false
}
