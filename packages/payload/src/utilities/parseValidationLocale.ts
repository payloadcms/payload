import type { TypedLocale } from '../index.js'
import type { ValidationLocaleSelector } from './resolveValidationLocales.js'

import { APIError } from '../errors/index.js'
import { httpStatus } from './httpStatus.js'

/**
 * Parses a REST `locale` query value. Repeated query parameters are represented as an array and
 * `locale=all` selects all locales.
 */
export function parseValidationLocaleSelector(locale: unknown): ValidationLocaleSelector {
  if (typeof locale === 'string') {
    if (locale.length === 0) {
      throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
    }

    if (locale === 'all') {
      return 'all'
    }

    return locale as TypedLocale
  }

  if (
    Array.isArray(locale) &&
    locale.length > 0 &&
    locale.every((value) => typeof value === 'string')
  ) {
    if (locale.some((value) => value.length === 0)) {
      throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
    }

    return locale as [TypedLocale, ...TypedLocale[]]
  }

  throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
}

/** Ensures a REST validation request body is a non-null JSON object. */
export function assertValidationData(data: unknown): asserts data is Record<string, unknown> {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new APIError('Validation data must be an object.', httpStatus.BAD_REQUEST)
  }
}
