import type { Payload } from 'payload'

type GetRequestLocalesArgs = {
  data?: Record<string, any>
  localization: Exclude<Payload['config']['localization'], false>
  searchParams?: URLSearchParams
}
export function getRequestLocales({ data, localization, searchParams }: GetRequestLocalesArgs): {
  fallbackLocale: string
  locale: string
} {
  let locale = searchParams.get('locale')
  let fallbackLocale = searchParams.get('fallback-locale') || searchParams.get('fallbackLocale')

  if (data) {
    if (data?.locale) {
      locale = data.locale
    }
    if (data?.['fallback-locale']) {
      fallbackLocale = data['fallback-locale']
    }
    if (data?.['fallbackLocale']) {
      fallbackLocale = data['fallbackLocale']
    }
  }

  const shouldFallback = Boolean(
    (localization && localization.fallback) ||
      (fallbackLocale && !['false', 'none', 'null'].includes(fallbackLocale)),
  )

  if (shouldFallback) {
    if (!fallbackLocale) {
      // Check for locale specific fallback
      const localeHasFallback =
        localization && localization?.locales?.length
          ? localization.locales.find((localeConfig) => localeConfig.code === locale)
              ?.fallbackLocale
          : false

      if (localeHasFallback) {
        fallbackLocale = localeHasFallback
      } else {
        // Use defaultLocale as fallback otherwise
        if (localization && 'fallback' in localization && localization.fallback) {
          fallbackLocale = localization.defaultLocale
        }
      }
    }
  } else {
    fallbackLocale = 'null'
  }

  if (locale === '*') {
    locale = 'all'
  } else if (!localization.localeCodes.includes(locale)) {
    locale = localization.defaultLocale
  }

  return {
    fallbackLocale,
    locale,
  }
}
