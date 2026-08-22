import type { ValidationResult } from '../collections/operations/local/validate.js'
import type { PayloadRequest } from '../types/index.js'

import { ValidationError } from '../errors/index.js'

/**
 * Maps a caught `ValidationError` to a `ValidationResult`, tagging each field error with the
 * request's locale. Rethrows any other error, since only field validation failures are part of
 * the validate operation's contract. Meant to be called from a `catch` block around the
 * `beforeValidate`/`beforeChange` hook sequence.
 */
export function toValidationResult({
  error,
  req,
}: {
  error: unknown
  req: PayloadRequest
}): ValidationResult {
  if (!(error instanceof ValidationError)) {
    throw error
  }

  return {
    errors: error.data.errors.map((validationError) => ({
      ...validationError,
      locale: req.locale ?? undefined,
    })),
    valid: false,
  }
}
