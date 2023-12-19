/**
 * sets request locale
 */
export default function localizationMiddleware(req, res, next) {
  const localization = req.payload.config.localization
  if (!localization) {
    next()
    return
  }

  const validLocales = [...localization.localeCodes, 'all']
  const validFallbackLocales = [...localization.localeCodes, 'null']

  let requestedLocale = req.query.locale || localization.defaultLocale
  let requestedFallbackLocale = req.query['fallback-locale']

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
  req.fallbackLocale = validFallbackLocales.find((locale) => locale === requestedFallbackLocale)

  req.locale = validLocales.find((locale) => locale === requestedLocale)

  if (!req.fallbackLocale) {
    req.fallbackLocale =
      localization.locales.find(({ code }) => req.locale === code)?.fallbackLocale ||
      localization.defaultLocale
  }
  next()
}
