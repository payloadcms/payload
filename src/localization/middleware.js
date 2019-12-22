import languageParser from 'accept-language-parser';

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
    let setLocale;
    if (req.query.locale) {
      setLocale = localization.locales.find(search => search === req.query.locale);
      if (setLocale) {
        req.locale = setLocale;
      }
    }
    if (req.body.locale) {
      setLocale = localization.locales.find(search => search === req.body.locale);
      if (setLocale) {
        req.locale = setLocale;
      }
    }


    if (!req.locale && req.headers['accept-language']) req.locale = languageParser.pick(localization.locales, req.headers['accept-language']);
    if (!req.locale) req.locale = localization.defaultLocale;
    return next();
  };

  return middleware;
}
