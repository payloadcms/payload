import languageParser from 'accept-language-parser';

/**
 * sets request locale
 *
 * @param localization
 * @returns {Function}
 */
export default function locale(localization) {
  return function (req, res, next) {
    let setLocale;
    if (req.query.locale) {
      setLocale = localization.languages.find(search => search === req.query.locale);
      if (setLocale) {
        req.locale = setLocale;
      }
      if (req.query.locale === '*' || req.query.locale === 'all')
        return next();
    }
    if (req.body.locale){
      setLocale = localization.languages.find(search => search === req.body.locale);
      if (setLocale) {
        req.locale = setLocale;
      }
    }
    if (!req.locale && req.headers['accept-language'])
      req.locale = languageParser.pick(localization.languages, req.headers['accept-language']);
    if (!req.locale)
      req.locale = localization.defaultLanguage;

    next();
  }
}
