export const getSupportedDateLocale = (locale = 'enUS'): string => {
  // Need to match our translation locales with the local codes of 'date-fns/locale to support date locales
  const formattedLocales = {
    ar: 'ar',
    az: 'az',
    bg: 'bg',
    cs: 'cs',
    de: 'de',
    en: 'enUS',
    es: 'es',
    fa: 'faIR',
    fr: 'fr',
    hr: 'hr',
    hu: 'hu',
    it: 'it',
    ja: 'ja',
    ko: 'ko',
    my: 'enUS', // Burmese is not currently supported
    nb: 'nb',
    nl: 'nl',
    pl: 'pl',
    pt: 'pt',
    ro: 'ro',
    ru: 'ru',
    sv: 'sv',
    th: 'th',
    tr: 'tr',
    ua: 'uk',
    vi: 'vi',
    zh: 'zhCN',
    zhTw: 'zhTW',
  }

  return formattedLocales[locale] || locale
}
