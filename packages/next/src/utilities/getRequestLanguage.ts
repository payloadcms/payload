import type { AcceptedLanguages } from '@payloadcms/translations'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js'
import type { SanitizedConfig } from 'payload/config'

import { extractHeaderLanguage } from '@payloadcms/translations'

type GetRequestLanguageArgs = {
  config: SanitizedConfig
  cookies: Map<string, string> | ReadonlyRequestCookies
  defaultLanguage?: AcceptedLanguages
  headers: Request['headers']
}

export const getRequestLanguage = ({
  config,
  cookies,
  defaultLanguage = 'en',
  headers,
}: GetRequestLanguageArgs): AcceptedLanguages => {
  const langCookie = cookies.get(`${config.cookiePrefix || 'payload'}-lng`)
  const languageFromCookie = typeof langCookie === 'string' ? langCookie : langCookie?.value
  const languageFromHeader = headers.get('Accept-Language')
    ? extractHeaderLanguage(headers.get('Accept-Language'))
    : undefined
  const fallbackLang = config?.i18n?.fallbackLanguage || defaultLanguage

  const supportedLanguageKeys = Object.keys(config?.i18n?.supportedLanguages || {})

  if (languageFromCookie && supportedLanguageKeys.includes(languageFromCookie)) {
    return languageFromCookie as AcceptedLanguages
  }

  if (languageFromHeader && supportedLanguageKeys.includes(languageFromHeader)) {
    return languageFromHeader
  }

  return supportedLanguageKeys.includes(fallbackLang) ? (fallbackLang as AcceptedLanguages) : 'en'
}
