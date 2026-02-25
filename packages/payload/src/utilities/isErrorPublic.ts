import { status as httpStatus } from 'http-status'

import type { SanitizedConfig } from '../config/types.js'

type PayloadError = {
  isPublic?: boolean
  status?: number
} & Error

/**
 * Determines if an error should be shown to the user.
 */
export function isErrorPublic(error: Error, config: SanitizedConfig) {
  const payloadError = error as PayloadError

  if (config.debug) {
    return true
  }
  if (payloadError.isPublic === true) {
    return true
  }
  if (payloadError.isPublic === false) {
    return false
  }
  if (payloadError.status && payloadError.status !== httpStatus.INTERNAL_SERVER_ERROR) {
    return true
  }

  return false
}
