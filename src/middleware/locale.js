import languageParser from 'accept-language-parser';

/**
 * sets request locale
 *
 * @param localization
 * @returns {Function}
 */
export default function locale(localization) {
  return function (req, res, next) {
    let query;
    if (req.query.locale) {
      query = localization.languages.find(locale => locale === req.query.locale);
      if (query) {
        req.locale = query;
      }
      if (req.query.locale === '*' || req.query.locale === 'all')
        return next();
    }
    if (!req.locale && req.headers['accept-language'])
      req.locale = languageParser.pick(localization.languages, req.headers['accept-language']);
    if (!req.locale)
      req.locale = localization.defaultLanguage;

    next();
  }
}
