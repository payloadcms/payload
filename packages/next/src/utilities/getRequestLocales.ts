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
  let fallbackLocale = searchParams.get('fallback-locale')

  if (data) {
    if (data?.locale) {
      locale = data.locale
    }
    if (data?.['fallback-locale']) {
      fallbackLocale = data['fallback-locale']
    }
  }

  if (fallbackLocale === 'none') {
    fallbackLocale = 'null'
  } else if (!localization.localeCodes.includes(fallbackLocale)) {
    fallbackLocale = localization.defaultLocale
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
