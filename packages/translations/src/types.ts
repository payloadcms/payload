import type { Locale } from 'date-fns'

import type { acceptedLanguages } from './utilities/languages.js'

type DateFNSKeys =
  | 'ar'
  | 'az'
  | 'bg'
  | 'cs'
  | 'de'
  | 'en-US'
  | 'es'
  | 'fa-IR'
  | 'fr'
  | 'hr'
  | 'hu'
  | 'it'
  | 'ja'
  | 'ko'
  | 'nb'
  | 'nl'
  | 'pl'
  | 'pt'
  | 'ro'
  | 'ru'
  | 'sk'
  | 'sv'
  | 'th'
  | 'tr'
  | 'uk'
  | 'vi'
  | 'zh-CN'
  | 'zh-TW'

export type Language = {
  dateFNSKey: DateFNSKeys
  translations: {
    [namespace: string]: {
      [key: string]: string
    }
  }
}

export type AcceptedLanguages = (typeof acceptedLanguages)[number]

export type SupportedLanguages = {
  [key in AcceptedLanguages]?: Language
}

export type TFunction = (key: string, options?: Record<string, any>) => string

export type I18n = {
  dateFNS: Locale
  /** Corresponding dateFNS key */
  dateFNSKey: DateFNSKeys
  /** The fallback language */
  fallbackLanguage: string
  /** The language of the request */
  language: string
  /** Translate function */
  t: TFunction
  translations: Language['translations']
}

export type I18nOptions = {
  fallbackLanguage?: string
  supportedLanguages?: SupportedLanguages
  translations?: Partial<{
    [key in AcceptedLanguages]?: Language['translations']
  }>
}

export type InitTFunction = (args: {
  config: I18nOptions
  language?: string
  translations: Language['translations']
}) => {
  t: TFunction
  translations: Language['translations']
}

export type InitI18n = (args: {
  config: I18nOptions
  context: 'api' | 'client'
  language?: AcceptedLanguages
}) => Promise<I18n>

export type LanguagePreference = {
  language: AcceptedLanguages
  quality?: number
}
