import { status as httpStatus } from 'http-status'

import type { TypedLocale } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/index.js'

// TypedLocale is narrowed by generated types, while its untyped fallback intentionally includes string.
/**
 * Locales accepted by collection and global on-demand validation.
 *
 * A non-empty array validates its unique locale codes in the order provided. `'all'` validates
 * every locale available to the request. Projects without localization use `null` in the Local
 * API or `locale=all` in the REST API.
 */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export type ValidationLocaleSelector =
  | 'all'
  | readonly [TypedLocale, ...TypedLocale[]]
  | TypedLocale
/* eslint-enable @typescript-eslint/no-redundant-type-constituents */

const validationLocaleConcurrency = 3
const sharedValidationRequestProperties = new Set([
  'i18n',
  'payload',
  'server',
  'signal',
  't',
  'transactionID',
])

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

export function cloneValidationRequest(
  request: Partial<PayloadRequest> | undefined,
): Partial<PayloadRequest> {
  if (!request) {
    return {}
  }

  const clonedRequest: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(request)) {
    if (key === 'payloadDataLoader') {
      continue
    }

    clonedRequest[key] = sharedValidationRequestProperties.has(key)
      ? value
      : cloneValidationValue(value)
  }

  // `context`/`query`/`routeParams` default to an empty object even when the source request never
  // set them, since downstream code reads their properties without checking for `undefined` first.
  Object.assign(clonedRequest, {
    context: cloneValidationValue(request.context ?? {}),
    query: cloneValidationValue(request.query ?? {}),
    routeParams: cloneValidationValue(request.routeParams ?? {}),
  })

  // `headers`/`method`/`signal`/`url` come from the underlying Fetch `Request` prototype as
  // getters rather than own properties, so the loop above never sees them to clone or share.
  Object.assign(clonedRequest, {
    headers: cloneValidationValue(request.headers),
    method: request.method,
    signal: request.signal,
    url: request.url,
  })

  return clonedRequest as Partial<PayloadRequest>
}

export function cloneValidationValue<T>(value: T, cache = new WeakMap<object, unknown>()): T {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) {
    return value
  }

  if (typeof value === 'function' || value instanceof Promise) {
    return value
  }

  const objectValue = value as object
  const cachedValue = cache.get(objectValue)

  if (cachedValue) {
    return cachedValue as T
  }

  if (value instanceof Headers) {
    return new Headers(value) as T
  }

  if (value instanceof URLSearchParams) {
    return new URLSearchParams(value) as T
  }

  if (value instanceof URL) {
    return new URL(value) as T
  }

  if (value instanceof Date) {
    return new Date(value) as T
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T
  }

  if (value instanceof ArrayBuffer) {
    return value.slice(0) as T
  }

  if (ArrayBuffer.isView(value)) {
    if (Buffer.isBuffer(value)) {
      return Buffer.from(value) as T
    }

    if (value instanceof DataView) {
      return new DataView(value.buffer.slice(0), value.byteOffset, value.byteLength) as T
    }

    return new (value.constructor as new (input: typeof value) => typeof value)(value)
  }

  if (value instanceof Map) {
    const clonedMap = new Map()
    cache.set(objectValue, clonedMap)
    for (const [key, mapValue] of value) {
      clonedMap.set(cloneValidationValue(key, cache), cloneValidationValue(mapValue, cache))
    }
    return clonedMap as T
  }

  if (value instanceof Set) {
    const clonedSet = new Set()
    cache.set(objectValue, clonedSet)
    for (const setValue of value) {
      clonedSet.add(cloneValidationValue(setValue, cache))
    }
    return clonedSet as T
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return value
  }

  const clonedValue: Record<PropertyKey, unknown> | unknown[] = Array.isArray(value)
    ? []
    : Object.create(Object.getPrototypeOf(value))
  cache.set(objectValue, clonedValue)

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)

    if (descriptor?.enumerable) {
      ;(clonedValue as Record<PropertyKey, unknown>)[key] = cloneValidationValue(
        (value as Record<PropertyKey, unknown>)[key],
        cache,
      )
    }
  }

  return clonedValue as T
}
