import type { Locale } from 'date-fns'

import { dateLocales } from './dateLocales.js'

export const getDateLocale = (
  locale = 'enUS',
): {
  locale: string
  localeData: Locale
} => {
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
    zhTW: 'zhTW',
  }

  const formattedLocale = formattedLocales[locale] || locale

  return {
    locale: formattedLocale,
    localeData: dateLocales[formattedLocale],
  }
}
