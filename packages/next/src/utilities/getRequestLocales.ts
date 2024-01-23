import { Payload } from 'payload'

type GetRequestLocalesArgs = {
  localization: Exclude<Payload['config']['localization'], false>
  data?: Record<string, any>
  searchParams?: URLSearchParams
}
export function getRequestLocales({ localization, searchParams, data }: GetRequestLocalesArgs): {
  locale: string
  fallbackLocale: string
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
    locale,
    fallbackLocale,
  }
}
