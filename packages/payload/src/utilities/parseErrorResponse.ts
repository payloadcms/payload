import type { ValidationFieldError } from '../errors/ValidationError.js'

export type ParsedNonFieldError = {
  /** Additional error metadata, including plugin-specific error codes. */
  [key: string]: unknown
  /** Additional details returned by the API. */
  data?: unknown
  /** Absent when a nested error does not provide a string message. */
  message?: string
}

export type ParsedErrorResponse = {
  /** Field errors in response order, including repeated paths in different locales. */
  fieldErrors: ValidationFieldError[]
  /** Body-level message, retained separately from errors and validation summaries. */
  message?: string
  /** Validation summaries and errors without a usable field path and message. */
  nonFieldErrors: ParsedNonFieldError[]
}

/**
 * Parses a decoded Payload REST error response without reading a Response or choosing display fallbacks.
 * Validation summaries and callback metadata are retained alongside field errors.
 */
export function parseErrorResponse({ body }: { body: unknown }): ParsedErrorResponse {
  const result: ParsedErrorResponse = { fieldErrors: [], nonFieldErrors: [] }
  const responseBody = getRecord({ value: body })

  if (!responseBody) {
    return result
  }

  if (typeof responseBody.message === 'string') {
    result.message = responseBody.message
  }

  if (!Array.isArray(responseBody.errors)) {
    return result
  }

  for (const value of responseBody.errors) {
    const error = getRecord({ value })

    if (!error) {
      continue
    }

    const legacyFieldError =
      typeof error.field === 'string' && error.field ? getFieldError({ error }) : undefined

    if (legacyFieldError) {
      result.fieldErrors.push(legacyFieldError)
    } else if (typeof error.message === 'string' && error.message) {
      result.nonFieldErrors.push(getNonFieldError({ error }))
    }

    const data = getRecord({ value: error.data })

    if (!Array.isArray(data?.errors)) {
      continue
    }

    for (const nestedValue of data.errors) {
      const nestedError = getRecord({ value: nestedValue })

      if (!nestedError) {
        continue
      }

      const fieldError = getFieldError({ error: nestedError })

      if (fieldError) {
        result.fieldErrors.push(fieldError)
      } else {
        result.nonFieldErrors.push(getNonFieldError({ error: nestedError }))
      }
    }
  }

  return result
}

function getFieldError({
  error,
}: {
  error: Record<string, unknown>
}): undefined | ValidationFieldError {
  const path =
    typeof error.path === 'string' && error.path
      ? error.path
      : typeof error.field === 'string'
        ? error.field
        : undefined

  if (!path || typeof error.message !== 'string') {
    return undefined
  }

  const fieldError: ValidationFieldError = { message: error.message, path }

  if (typeof error.locale === 'string') {
    fieldError.locale = error.locale
  }

  if (typeof error.tableName === 'string') {
    fieldError.tableName = error.tableName
  }

  if (typeof error.label === 'string') {
    fieldError.label = error.label
  } else {
    const label = getRecord({ value: error.label })

    if (label && Object.values(label).every((value) => typeof value === 'string')) {
      fieldError.label = label as Record<string, string>
    }
  }

  return fieldError
}

function getNonFieldError({ error }: { error: Record<string, unknown> }): ParsedNonFieldError {
  const { message, ...metadata } = error

  return typeof message === 'string' ? { ...metadata, message } : metadata
}

function getRecord({ value }: { value: unknown }): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
