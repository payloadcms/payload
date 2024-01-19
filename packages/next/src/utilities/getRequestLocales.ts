import { Payload } from 'payload'

type GetRequestLocalesArgs = {
  localization: Exclude<Payload['config']['localization'], false>
  requestData?: Record<string, any>
  searchParams?: URLSearchParams
}
export function getRequestLocales({
  localization,
  searchParams,
  requestData,
}: GetRequestLocalesArgs): {
  locale: string
  fallbackLocale: string
} {
  let locale = searchParams.get('locale')
  let fallbackLocale = searchParams.get('fallback-locale')

  if (requestData) {
    if (requestData?.locale) {
      locale = requestData.locale
    }
    if (requestData?.['fallback-locale']) {
      fallbackLocale = requestData['fallback-locale']
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
