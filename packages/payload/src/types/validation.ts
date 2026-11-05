import type { ValidationFieldError } from '../errors/ValidationError.js'

/**
 * The result of validating a collection or global document candidate without persisting it.
 *
 * Field validation failures are returned in this result. Access denials, invalid arguments,
 * missing documents, and other lifecycle errors throw instead.
 */
export type ValidationResult = {
  /**
   * Field validation errors. Errors from localized passes are tagged with the locale that failed;
   * non-localized validation may omit the locale.
   * Empty when {@link valid} is `true`.
   */
  errors: ValidationFieldError[]
  /** Whether the candidate passed field validation in every selected locale. */
  valid: boolean
}
