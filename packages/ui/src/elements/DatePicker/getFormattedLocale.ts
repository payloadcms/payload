'use client'
export const getFormattedLocale = (language = 'enUS') => {
  const formattedLocales = {
    da: 'da',
    en: 'enUS',
    my: 'enUS', // Burmese is not currently supported
    ua: 'uk',
    zh: 'zhCN',
  }

  const formattedLocale = formattedLocales[language] || language

  return formattedLocale
}
