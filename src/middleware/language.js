import languageParser from 'accept-language-parser';

/**
 * sets request language
 *
 * @param localization
 * @returns {Function}
 */
export default function language(localization) {
  return function (req, res, next) {
    let language;
    if (req.query.lang) {
      language = localization.languages.find(lang => lang === req.query.lang);
      if (language) {
        req.language = language;
      }
    }
    if (!req.language && req.headers['accept-language'])
      req.language = languageParser.pick(localization.languages, req.headers['accept-language']);
    if (!req.language)
      req.language = localization.defaultLanguage;

    next()
  }
}
