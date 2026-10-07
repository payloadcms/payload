import { status as httpStatus } from 'http-status'

import type { TypedLocale } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/index.js'

// TypedLocale is narrowed by generated types, while its untyped fallback intentionally includes string.
/**
 * Locales accepted by collection and global on-demand validation.
 *
 * A non-empty array validates its unique locale codes in the order provided. `'all'` validates
 * every locale available to the request. When omitted by the public APIs, validation uses the
 * request locale, or the configured default locale.
 */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export type ValidationLocaleSelector =
  | 'all'
  | readonly [TypedLocale, ...TypedLocale[]]
  | TypedLocale
/* eslint-enable @typescript-eslint/no-redundant-type-constituents */

const validationLocaleConcurrency = 3

export async function resolveValidationLocales({
  locale,
  req,
}: {
  locale: ValidationLocaleSelector
  req: PayloadRequest
}): Promise<TypedLocale[]> {
  const localization = req.payload.config.localization

  if (!localization) {
    if (locale === 'all') {
      return [null] as TypedLocale[]
    }

    const locales = Array.isArray(locale) ? locale : [locale]

    if (locales.length === 0 || locales.some((value) => value !== null)) {
      throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
    }

    return [...new Set(locales)]
  }

  let availableLocaleCodes = localization.localeCodes

  if (localization.filterAvailableLocales) {
    const availableLocales = await localization.filterAvailableLocales({
      locales: localization.locales,
      req,
    })
    availableLocaleCodes = availableLocales.map((availableLocale) =>
      typeof availableLocale === 'string' ? availableLocale : availableLocale.code,
    )
  }

  if (locale === 'all') {
    if (availableLocaleCodes.length === 0) {
      throw new APIError('No validation locales are available.', httpStatus.BAD_REQUEST)
    }

    return [...new Set(availableLocaleCodes)] as TypedLocale[]
  }

  const requestedLocales = Array.isArray(locale) ? locale : [locale]

  if (
    requestedLocales.length === 0 ||
    requestedLocales.some(
      (requestedLocale) => typeof requestedLocale !== 'string' || requestedLocale.length === 0,
    )
  ) {
    throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
  }

  const locales = [...new Set(requestedLocales)]

  for (const requestedLocale of locales) {
    if (!localization.localeCodes.includes(requestedLocale as string)) {
      throw new APIError(
        `Validation locale "${String(requestedLocale)}" is not configured.`,
        httpStatus.BAD_REQUEST,
      )
    }

    if (!availableLocaleCodes.includes(requestedLocale as string)) {
      throw new APIError(
        `Validation locale "${String(requestedLocale)}" is not available.`,
        httpStatus.BAD_REQUEST,
      )
    }
  }

  return locales
}

/**
 * A request that already carries a transaction ID shares a database session with the transaction
 * it was cloned from. Concurrent operations on one session are unsafe, so locale passes must run
 * one at a time rather than with the default concurrency.
 */
export function resolveValidationConcurrency(
  req: Partial<PayloadRequest> | undefined,
): number | undefined {
  return req?.transactionID ? 1 : undefined
}

export async function runValidationLocalePasses<TResult>({
  concurrency = validationLocaleConcurrency,
  locales,
  validate,
}: {
  /**
   * Maximum number of locale passes to run at once. Pass `1` when the request being validated
   * shares a database session with an already-open transaction, since concurrent operations on
   * one session are unsafe.
   * @default 3
   */
  concurrency?: number
  locales: TypedLocale[]
  validate: (locale: TypedLocale) => Promise<TResult>
}): Promise<TResult[]> {
  const batchSize = Math.max(1, Math.min(concurrency, locales.length))
  const results: TResult[] = []

  for (let batchStart = 0; batchStart < locales.length; batchStart += batchSize) {
    const batch = locales.slice(batchStart, batchStart + batchSize)
    results.push(...(await Promise.all(batch.map((locale) => validate(locale)))))
  }

  return results
}
