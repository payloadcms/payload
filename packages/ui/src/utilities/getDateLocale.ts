import type { Locale } from 'date-fns'

import { dateLocales } from './dateLocales.js'

export const getDateLocale = (
  locale = 'enUS',
): {
  locale: string
  localeData: Locale
} => {
  const formattedLocales = {
    en: 'enUS',
    my: 'enUS', // Burmese is not currently supported
    ua: 'uk',
    zh: 'zhCN',
  }

  const formattedLocale = formattedLocales[locale] || locale

  return {
    locale: formattedLocale,
    localeData: dateLocales[formattedLocale],
  }
}
