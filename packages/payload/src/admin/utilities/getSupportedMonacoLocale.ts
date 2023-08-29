export const getSupportedMonacoLocale = (locale: string): string => {
  const supportedLocales = {
    de: 'de',
    es: 'es',
    fr: 'fr',
    it: 'it',
    ja: 'ja',
    ko: 'ko',
    ru: 'ru',
    zh: 'zh-cn',
    'zh-tw': 'zh-tw',
  }

  return supportedLocales[locale]
}
