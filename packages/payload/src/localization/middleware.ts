import type { SanitizedLocalizationConfig } from '../config/types'

/**
 * sets request locale
 *
 * @param localization
 * @returns {Function}
 */
export default function localizationMiddleware(localization: SanitizedLocalizationConfig | false) {
  const middleware = (req, res, next) => {
    if (localization) {
      const validLocales = [...localization.localeCodes, 'all']
      const validFallbackLocales = [...localization.localeCodes, 'null']

      let requestedLocale = req.query.locale || localization.defaultLocale
      let requestedFallbackLocale = req.query['fallback-locale'] || localization.defaultLocale

      if (req.body) {
        if (req.body.locale) requestedLocale = req.body.locale
        if (req.body['fallback-locale']) {
          requestedFallbackLocale = req.body['fallback-locale']
        }
      }

      if (requestedFallbackLocale === 'none') requestedFallbackLocale = 'null'
      if (requestedLocale === '*' || requestedLocale === 'all') {
        requestedLocale = 'all'
      }

      if (validLocales.find((locale) => locale === requestedLocale)) {
        req.locale = requestedLocale
      }

      if (validFallbackLocales.find((locale) => locale === requestedFallbackLocale)) {
        req.fallbackLocale = requestedFallbackLocale
      }
    }

    return next()
  }

  return middleware
}
