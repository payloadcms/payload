import { status as httpStatus } from 'http-status'

import type { TypedLocale } from '../index.js'

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

export function assertValidationData(data: unknown): asserts data is Record<string, unknown> {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new APIError('Validation data must be an object.', httpStatus.BAD_REQUEST)
  }
}
