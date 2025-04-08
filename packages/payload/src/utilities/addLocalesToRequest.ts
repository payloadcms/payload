// @ts-strict-ignore
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { sanitizeFallbackLocale } from './sanitizeFallbackLocale.js'

/**
 * Mutates the Request to contain 'locale' and 'fallbackLocale' based on data or searchParams
 */
export function addLocalesToRequestFromData(req: PayloadRequest): void {
  const {
    data,
    payload: { config },
  } = req

  if (data) {
    const localeOnReq = req.locale
    const fallbackLocaleOnReq = req.fallbackLocale
    let localeFromData
    let fallbackLocaleFromData

    if (!localeOnReq && data?.locale && typeof data.locale === 'string') {
      localeFromData = data.locale
    }

    if (!fallbackLocaleOnReq) {
      if (data?.['fallback-locale'] && typeof data?.['fallback-locale'] === 'string') {
        fallbackLocaleFromData = data['fallback-locale']
      }

      if (data?.['fallbackLocale'] && typeof data?.['fallbackLocale'] === 'string') {
        fallbackLocaleFromData = data['fallbackLocale']
      }
    }

    if (!localeOnReq || !fallbackLocaleOnReq) {
      const { fallbackLocale, locale } = sanitizeLocales({
        fallbackLocale: fallbackLocaleFromData,
        locale: localeFromData,
        localization: config.localization,
      })

      if (localeFromData) {
        req.locale = locale
      }

      if (fallbackLocaleFromData) {
        req.fallbackLocale = fallbackLocale
      }
    }
  }
}

type SanitizeLocalesArgs = {
  fallbackLocale: string
  locale: string
  localization: SanitizedConfig['localization']
}
type SanitizeLocalesReturn = {
  fallbackLocale?: string
  locale?: string
}
export const sanitizeLocales = ({
  fallbackLocale,
  locale,
  localization,
}: SanitizeLocalesArgs): SanitizeLocalesReturn => {
  // Check if localization has fallback enabled or if a fallback locale is provided

  if (localization) {
    fallbackLocale = sanitizeFallbackLocale({
      fallbackLocale,
      locale,
      localization,
    })
  }

  if (['*', 'all'].includes(locale)) {
    locale = 'all'
  } else if (localization && !localization.localeCodes.includes(locale) && localization.fallback) {
    locale = localization.defaultLocale
  }

  return {
    fallbackLocale,
    locale,
  }
}
