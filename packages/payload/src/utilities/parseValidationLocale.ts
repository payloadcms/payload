import { status as httpStatus } from 'http-status'

import type { TypedLocale } from '../index.js'
import type { ValidationLocaleSelector } from './resolveValidationLocales.js'

import { APIError } from '../errors/index.js'

type ValidationLocale =
  | {
      locale: TypedLocale
      type: 'single'
    }
  | {
      locales: TypedLocale[]
      type: 'multiple'
    }
  | {
      type: 'all'
    }

export function parseValidationLocale(locale: unknown): ValidationLocale {
  if (typeof locale === 'string') {
    if (locale.length === 0) {
      throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
    }

    if (locale === 'all') {
      return { type: 'all' }
    }

    return {
      type: 'single',
      locale: locale as TypedLocale,
    }
  }

  if (
    Array.isArray(locale) &&
    locale.length > 0 &&
    locale.every((value) => typeof value === 'string')
  ) {
    if (locale.some((value) => value.length === 0)) {
      throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
    }

    return {
      type: 'multiple',
      locales: locale as TypedLocale[],
    }
  }

  throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
}

export function parseSingleValidationLocale(locale: unknown): TypedLocale {
  const parsedLocale = parseValidationLocale(locale)

  if (parsedLocale.type !== 'single') {
    throw new APIError('Validation requires a single locale.', httpStatus.BAD_REQUEST)
  }

  return parsedLocale.locale
}

/**
 * Parses a REST `locale` query value. Repeated query parameters are represented as an array and
 * `locale=all` selects all locales.
 */
export function parseValidationLocaleSelector(locale: unknown): ValidationLocaleSelector {
  const parsedLocale = parseValidationLocale(locale)

  switch (parsedLocale.type) {
    case 'all':
      return 'all'

    case 'multiple':
      return parsedLocale.locales

    case 'single':
      return parsedLocale.locale
  }
}

/** Ensures a REST validation request body is a non-null JSON object. */
export function assertValidationData(data: unknown): asserts data is Record<string, unknown> {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new APIError('Validation data must be an object.', httpStatus.BAD_REQUEST)
  }
}
