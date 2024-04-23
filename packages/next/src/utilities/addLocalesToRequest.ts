import type { PayloadRequest } from 'payload/types'

type AddLocalesToRequestArgs = {
  request: PayloadRequest
}

/**
 * Mutates the Request to contain 'locale' and 'fallbackLocale' based on data or searchParams
 */
export function addLocalesToRequest({ request }: AddLocalesToRequestArgs): void {
  const {
    data,
    payload: { config },
  } = request
  const { localization } = config
  const urlProperties = new URL(request.url)
  const { searchParams } = urlProperties

  let locale = searchParams.get('locale')
  let fallbackLocale = searchParams.get('fallback-locale')

  if (data) {
    if (data?.locale && typeof data.locale === 'string') {
      locale = data.locale
    }
    if (data?.['fallback-locale'] && typeof data?.['fallback-locale'] === 'string') {
      fallbackLocale = data['fallback-locale']
    }
  }

  if (fallbackLocale === 'none') {
    fallbackLocale = 'null'
  } else if (localization && !localization.localeCodes.includes(fallbackLocale)) {
    fallbackLocale = localization.defaultLocale
  }

  if (locale === '*') {
    locale = 'all'
  } else if (localization && !localization.localeCodes.includes(locale)) {
    locale = localization.defaultLocale
  }

  if (locale) request.locale = locale
  if (fallbackLocale) request.fallbackLocale = fallbackLocale
}
