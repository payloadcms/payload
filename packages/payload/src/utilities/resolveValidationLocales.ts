import { status as httpStatus } from 'http-status'

import type { TypedLocale } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/index.js'

// TypedLocale is narrowed by generated types, while its untyped fallback intentionally includes string.
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type ValidationLocaleSelector = 'all' | TypedLocale | TypedLocale[]

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

  const clonedRequest: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(request)) {
    if (key === 'payloadDataLoader') {
      continue
    }

    clonedRequest[key] = sharedValidationRequestProperties.has(key)
      ? value
      : cloneValidationValue(value)
  }

  Object.assign(clonedRequest, {
    context: cloneValidationValue(request.context ?? {}),
    data: cloneValidationValue(request.data),
    file: cloneValidationValue(request.file),
    files: cloneValidationValue(request.files),
    hash: request.hash,
    headers: request.headers ? new Headers(request.headers) : undefined,
    host: request.host,
    href: request.href,
    method: request.method,
    origin: request.origin,
    pathname: request.pathname,
    payloadUploadSizes: cloneValidationValue(request.payloadUploadSizes),
    port: request.port,
    protocol: request.protocol,
    query: cloneValidationValue(request.query ?? {}),
    responseHeaders: request.responseHeaders ? new Headers(request.responseHeaders) : undefined,
    routeParams: cloneValidationValue(request.routeParams ?? {}),
    search: request.search,
    searchParams: request.searchParams ? new URLSearchParams(request.searchParams) : undefined,
    signal: request.signal,
    url: request.url,
    user: cloneValidationValue(request.user),
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
