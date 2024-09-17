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

    if (
      !fallbackLocaleOnReq &&
      data?.['fallback-locale'] &&
      typeof data?.['fallback-locale'] === 'string'
    ) {
      fallbackLocaleOnReq = data['fallback-locale']
    }

    const { fallbackLocale, locale } = sanitizeLocales({
      fallbackLocale: fallbackLocaleOnReq,
      locale: localeOnReq,
      localization: config.localization,
    })

    if (locale) {
      req.locale = locale
    }
    if (fallbackLocale) {
      req.fallbackLocale = fallbackLocale
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
  if (['none', 'null'].includes(fallbackLocale)) {
    fallbackLocale = 'null'
  } else if (localization && !localization.localeCodes.includes(fallbackLocale)) {
    fallbackLocale = localization.defaultLocale
  }

  if (locale === '*') {
    locale = 'all'
  } else if (localization && !localization.localeCodes.includes(locale)) {
    locale = localization.defaultLocale
  }

  return {
    fallbackLocale,
    locale,
  }
}
