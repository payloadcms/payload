import type { AcceptedLanguages, LanguagePreference } from '../types.js'

export const rtlLanguages = ['ar', 'fa', 'he'] as const

export const acceptedLanguages = [
  'ar',
  'az',
  'bg',
  'bn-BD',
  'bn-IN',
  'ca',
  'cs',
  'bn-BD',
  'bn-IN',
  'da',
  'de',
  'en',
  'es',
  'et',
  'fa',
  'fr',
  'he',
  'hr',
  'hu',
  'hy',
  'id',
  'is',
  'it',
  'ja',
  'ko',
  'lt',
  'lv',
  'my',
  'nb',
  'nl',
  'pl',
  'pt',
  'ro',
  'rs',
  'rs-latin',
  'ru',
  'sk',
  'sl',
  'sv',
  'ta',
  'th',
  'tr',
  'uk',
  'vi',
  'zh',
  'zh-TW',

  /**
   * Languages not implemented:
   *
   * 'af',
   * 'am',
   * 'ar-sa',
   * 'as',
   * 'az-latin',
   * 'be',
   * 'bs',
   * 'ca-ES-valencia',
   * 'cy',
   * 'el',
   * 'en-GB',
   * 'en-US',
   * 'es-ES',
   * 'es-US',
   * 'es-MX',
   * 'eu',
   * 'fi',
   * 'fil-Latn',
   * 'fr-FR',
   * 'fr-CA',
   * 'ga',
   * 'gd-Latn',
   * 'gl',
   * 'gu',
   * 'ha-Latn',
   * 'hi',
   * 'ig-Latn',
   * 'it-it',
   * 'ka',
   * 'kk',
   * 'km',
   * 'kn',
   * 'kok',
   * 'ku-Arab',
   * 'ky-Cyrl',
   * 'lb',
   * 'mi-Latn',
   * 'mk',
   * 'ml',
   * 'mn-Cyrl',
   * 'mr',
   * 'ms',
   * 'mt',
   * 'ne',
   * 'nl-BE',
   * 'nn',
   * 'nso',
   * 'or',
   * 'pa',
   * 'pa-Arab',
   * 'prs-Arab',
   * 'pt-BR',
   * 'pt-PT',
   * 'qut-Latn',
   * 'quz',
   * 'rw',
   * 'sd-Arab',
   * 'si',
   * 'sq',
   * 'sr-Cyrl-BA',
   * 'sr-Cyrl-RS',
   * 'sr-Latn-RS',
   * 'sw',
   * 'ta',
   * 'te',
   * 'tg-Cyrl',
   * 'ti',
   * 'tk-Latn',
   * 'tn',
   * 'tt-Cyrl',
   * 'ug-Arab',
   * 'ur',
   * 'uz-Latn',
   * 'wo',
   * 'xh',
   * 'yo-Latn',
   * 'zh-Hans',
   * 'zh-Hant',
   * 'zu',
   */
] as const

function parseAcceptLanguage(acceptLanguageHeader: string): LanguagePreference[] {
  return acceptLanguageHeader
    .split(',')
    .map((lang) => {
      const [language, quality] = lang.trim().split(';q=') as [
        AcceptedLanguages,
        string | undefined,
      ]
      return {
        language,
        quality: quality ? parseFloat(quality) : 1,
      }
    })
    .sort((a, b) => b.quality - a.quality) // Sort by quality, highest to lowest
}

export function extractHeaderLanguage(acceptLanguageHeader: string): AcceptedLanguages | undefined {
  const parsedHeader = parseAcceptLanguage(acceptLanguageHeader)

  let matchedLanguage: AcceptedLanguages | undefined

  for (const { language } of parsedHeader) {
    if (matchedLanguage) {
      break
    }

    if (acceptedLanguages.includes(language)) {
      matchedLanguage = language
      break
    }

    const baseLanguage = language.split('-')[0] as AcceptedLanguages
    if (acceptedLanguages.includes(baseLanguage)) {
      matchedLanguage = baseLanguage
      break
    }
  }

  return matchedLanguage
}
