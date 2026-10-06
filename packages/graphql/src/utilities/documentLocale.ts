import type { DocumentVersion, PayloadRequest } from 'payload'

import { isolateObjectProperty } from 'payload'

import { rememberDocumentVersion } from './documentVersion.js'

const documentLocales = new WeakMap<object, string>()

/** Carry the operation locale through returned data without changing shared root requests. */
export function rememberDocumentLocale<T>({ data, locale }: { data: T; locale?: string }): T {
  if (locale === undefined) {
    return data
  }
  const visited = new WeakSet<object>()
  const remember = ({ value }: { value: unknown }): void => {
    if (!value || typeof value !== 'object' || visited.has(value)) {
      return
    }
    visited.add(value)
    documentLocales.set(value, locale)
    for (const child of Object.values(value)) {
      remember({ value: child })
    }
  }
  remember({ value: data })
  return data
}

export function getDocumentLocale({
  fallbackLocale,
  locale,
  parent,
}: {
  fallbackLocale?: string
  locale?: string
  parent: unknown
}): string | undefined {
  return (
    locale ??
    (parent && typeof parent === 'object' ? documentLocales.get(parent) : undefined) ??
    fallbackLocale
  )
}

/** Preserve both selectors when resolvers clone containers or load related documents. */
export function rememberDocumentContext<T>({
  data,
  locale,
  version,
}: {
  data: T
  locale?: string
  version: DocumentVersion
}): T {
  return rememberDocumentLocale({ data: rememberDocumentVersion({ data, version }), locale })
}

export function getDocumentRequest({
  parent,
  req,
}: {
  parent: unknown
  req: PayloadRequest
}): PayloadRequest {
  const locale = getDocumentLocale({ parent })
  if (locale === undefined || locale === req.locale) {
    return req
  }
  const localeReq = isolateObjectProperty(req, 'locale')
  localeReq.locale = locale
  return localeReq
}
