/**
 * Languages of localized fields: those marked `localized: true`, currently the text of the Vigor
 * website (src/vigor). A field that isn't translated shows the English text.
 *
 * `code` is what websites send as `?locale=`, so keep it once a language is live. The codes match
 * the Vigor website's languages. To add a language, add a line here and restart the CMS.
 */
export const locales = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'zh-Hant', label: '繁體中文' },
]
