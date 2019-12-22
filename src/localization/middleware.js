/**
 * sets request locale
 *
 * @param localization
 * @returns {Function}
 */
export default function localizationMiddleware(localization) {
  const middleware = (req, res, next) => {
    if (req.query.locale === '*' || req.query.locale === 'all') {
      req.locale = 'all';
      return next();
    }

    let requestedLocale = req.body && req.body.locale;
    if (req.query.locale) requestedLocale = req.query.locale;

    if (localization.locales.find(search => search === requestedLocale)) {
      req.locale = requestedLocale;
    }

    if (!req.locale) req.locale = localization.defaultLocale;
    return next();
  };

  return middleware;
}
