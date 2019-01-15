import languageParser from 'accept-language-parser';

/**
 * sets request language
 *
 * @param localization
 * @returns {Function}
 */
export default function language(localization) {
  return function (req, res, next) {
    let query;
    if (req.query.lang) {
      query = localization.languages.find(lang => lang === req.query.lang);
      if (query) {
        req.language = query;
      }
      if (req.query.lang === '*' || req.query.lang === 'all')
        return next();
    }
    if (!req.language && req.headers['accept-language'])
      req.language = languageParser.pick(localization.languages, req.headers['accept-language']);
    if (!req.language)
      req.language = localization.defaultLanguage;

    next();
  }
}
