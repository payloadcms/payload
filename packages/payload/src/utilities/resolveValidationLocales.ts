import { status as httpStatus } from 'http-status'

import type { TypedLocale } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/index.js'

// TypedLocale is narrowed by generated types, while its untyped fallback intentionally includes string.
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type ValidationLocaleSelector = 'all' | TypedLocale | TypedLocale[]

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

export async function runValidationLocalePasses<TResult>({
  locales,
  validate,
}: {
  locales: TypedLocale[]
  validate: (locale: TypedLocale) => Promise<TResult>
}): Promise<TResult[]> {
  const results = new Array<TResult>(locales.length)
  let nextLocaleIndex = 0

  const workers = Array.from(
    { length: Math.min(validationLocaleConcurrency, locales.length) },
    async () => {
      while (nextLocaleIndex < locales.length) {
        const localeIndex = nextLocaleIndex
        nextLocaleIndex += 1
        results[localeIndex] = await validate(locales[localeIndex]!)
      }
    },
  )

  await Promise.all(workers)

  return results
}

export function cloneValidationRequest(
  request: Partial<PayloadRequest> | undefined,
): Partial<PayloadRequest> {
  if (!request) {
    return {}
  }

  const { payloadDataLoader: _payloadDataLoader, ...requestProperties } = request
  const clonedRequest = {
    ...requestProperties,
    context: { ...(request.context ?? {}) },
    headers: request.headers ? new Headers(request.headers) : undefined,
    host: request.host,
    method: request.method,
    origin: request.origin,
    pathname: request.pathname,
    protocol: request.protocol,
    query: { ...(request.query ?? {}) },
    routeParams: { ...(request.routeParams ?? {}) },
    searchParams: request.searchParams ? new URLSearchParams(request.searchParams) : undefined,
    signal: request.signal,
    url: request.url,
  } as Partial<PayloadRequest>

  return clonedRequest
}
