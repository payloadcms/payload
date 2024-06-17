import type {
  PayloadRequest,
  PayloadRequestData,
  PayloadRequestWithData,
  SanitizedConfig,
} from 'payload'

/**
 * Mutates the Request to contain 'locale' and 'fallbackLocale' based on data or searchParams
 */
type Args = {
  request: PayloadRequest & PayloadRequestData
}
export function addLocalesToRequestFromData({ request }: Args): PayloadRequestWithData {
  const {
    data,
    payload: { config },
  } = request

  if (data) {
    let localeOnReq = request.locale
    let fallbackLocaleOnReq = request.fallbackLocale

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

    const mutableRequest = request
    if (locale) mutableRequest.locale = locale
    if (fallbackLocale) mutableRequest.fallbackLocale = fallbackLocale
    return mutableRequest
  }

  return request
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
