import type { PayloadRequest, SanitizedConfig } from 'payload'

/**
 * Mutates the Request to contain 'locale' and 'fallbackLocale' based on data or searchParams
 */
export function addLocalesToRequestFromData(req: PayloadRequest): void {
  const {
    data,
    payload: { config },
  } = req

  if (data) {
    let localeOnReq = req.locale
    let fallbackLocaleOnReq = req.fallbackLocale

    if (!localeOnReq && data?.locale && typeof data.locale === 'string') {
      localeOnReq = data.locale
    }

    if (!fallbackLocaleOnReq) {
      if (data?.['fallback-locale'] && typeof data?.['fallback-locale'] === 'string')
        fallbackLocaleOnReq = data['fallback-locale']

      if (data?.['fallbackLocale'] && typeof data?.['fallbackLocale'] === 'string')
        fallbackLocaleOnReq = data['fallbackLocale']
    }

    const { fallbackLocale, locale } = sanitizeLocales({
      fallbackLocale: fallbackLocaleOnReq,
      locale: localeOnReq,
      localization: config.localization,
    })

    if (locale) req.locale = locale
    if (fallbackLocale) req.fallbackLocale = fallbackLocale
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
  if (['none', 'null'].includes(fallbackLocale)) {
    fallbackLocale = 'null'
  } else if (localization && !localization.localeCodes.includes(fallbackLocale)) {
    if ('fallback' in localization && localization.fallback) {
      fallbackLocale = localization.defaultLocale
    }
  }

  if (!fallbackLocale) {
    const localeHasFallback =
      localization && localization?.locales?.length
        ? localization.locales.find((localeConfig) => localeConfig.code === locale)?.fallbackLocale
        : false

    if (localeHasFallback) {
      fallbackLocale = localeHasFallback
    }
  }

  if (locale === '*') {
    locale = 'all'
  } else if (localization && !localization.localeCodes.includes(locale) && localization.fallback) {
    locale = localization.defaultLocale
  }

  return {
    fallbackLocale,
    locale,
  }
}
