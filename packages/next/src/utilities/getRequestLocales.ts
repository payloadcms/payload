import type { Payload } from 'payload'

import { sanitizeFallbackLocale } from 'payload'

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

  fallbackLocale = sanitizeFallbackLocale({
    fallbackLocale,
    locale,
    localization,
  })

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
