import type { Locale } from 'date-fns'

import type { clientTranslationKeys } from './clientKeys.js'
import type { enTranslations } from './languages/en.js'
import type { acceptedLanguages } from './utilities/languages.js'

type DateFNSKeys =
  | 'ar'
  | 'az'
  | 'bg'
  | 'ca'
  | 'cs'
  | 'da'
  | 'de'
  | 'en-US'
  | 'es'
  | 'et'
  | 'fa-IR'
  | 'fr'
  | 'he'
  | 'hr'
  | 'hu'
  | 'hy-AM'
  | 'it'
  | 'ja'
  | 'ko'
  | 'lt'
  | 'nb'
  | 'nl'
  | 'pl'
  | 'pt'
  | 'ro'
  | 'rs'
  | 'rs-Latin'
  | 'ru'
  | 'sk'
  | 'sl-SI'
  | 'sv'
  | 'th'
  | 'tr'
  | 'uk'
  | 'vi'
  | 'zh-CN'
  | 'zh-TW'

export type Language<TDefaultTranslations = DefaultTranslationsObject> = {
  dateFNSKey: DateFNSKeys
  translations: TDefaultTranslations
}

export type GenericTranslationsObject = {
  [key: string]: GenericTranslationsObject | string
}

export type GenericLanguages = {
  [key in AcceptedLanguages]?: GenericTranslationsObject
}

export type AcceptedLanguages = (typeof acceptedLanguages)[number]

export type SupportedLanguages<TDefaultTranslations = DefaultTranslationsObject> = {
  [key in AcceptedLanguages]?: Language<TDefaultTranslations>
}

/**
 * Type utilities for converting between translation objects ( e.g. general: { createNew: 'Create New' } )  and translations keys ( e.g. general:createNew )
 */

export type NestedKeysUnSanitized<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string
        ? T[K] extends object
          ? `${K}:${NestedKeysUnSanitized<T[K]>}` | null
          : `${K}`
        : never
    }[keyof T]
  : ''

// Utility type to strip specific suffixes
export type StripCountVariants<TKey> = TKey extends
  | `${infer Base}_many`
  | `${infer Base}_one`
  | `${infer Base}_other`
  ? Base
  : TKey

export type NestedKeysStripped<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string
        ? T[K] extends object
          ? `${K}:${NestedKeysStripped<T[K]>}`
          : `${StripCountVariants<K>}`
        : never
    }[keyof T]
  : ''

export type ReconstructObjectFromTranslationKeys<
  TPath extends string,
  TValue = string,
> = TPath extends `${infer First}:${infer Rest}`
  ? { [K in First]: ReconstructObjectFromTranslationKeys<Rest, TValue> }
  : { [K in TPath]: TValue }

/**
 * Default nested translations object
 */
export type DefaultTranslationsObject = typeof enTranslations

/**
 * All translation keys unSanitized. E.g. 'general:aboutToDeleteCount_many'
 */
export type DefaultTranslationKeysUnSanitized = NestedKeysUnSanitized<DefaultTranslationsObject>

/**
 * All translation keys sanitized. E.g. 'general:aboutToDeleteCount'
 */
export type DefaultTranslationKeys = NestedKeysStripped<DefaultTranslationsObject>

export type ClientTranslationKeys<TExtraProps = (typeof clientTranslationKeys)[number]> =
  TExtraProps

// Use GenericTranslationsObject instead of reconstructing the object from the client keys. This is because reconstructing the object is
// A) Expensive on performance.
// B) Not important to be typed specifically for the client translations. We really only care about the client translation keys to be typed.
// C) Inaccurate. Client keys which previously had _many, _one or other suffixes have been removed and cannot be reconstructed
export type ClientTranslationsObject = GenericTranslationsObject //ReconstructObjectFromTranslationKeys<ClientTranslationKeys>

export type TFunction<TTranslationKeys = DefaultTranslationKeys> = (
  key: TTranslationKeys,
  options?: Record<string, any>,
) => string

export type I18n<
  TTranslations = DefaultTranslationsObject,
  TTranslationKeys = DefaultTranslationKeys,
> = {
  dateFNS: Locale
  /** Corresponding dateFNS key */
  dateFNSKey: DateFNSKeys
  /** The fallback language */
  fallbackLanguage: string
  /** The language of the request */
  language: string
  /** Translate function */
  t: TFunction<TTranslationKeys>
  translations: Language<TTranslations>['translations']
}

export type I18nOptions<TTranslations = DefaultTranslationsObject> = {
  fallbackLanguage?: AcceptedLanguages
  supportedLanguages?: SupportedLanguages
  translations?: Partial<{
    [key in AcceptedLanguages]?: Language<TTranslations>['translations']
  }>
}

export type InitTFunction<
  TTranslations = DefaultTranslationsObject,
  TTranslationKeys = DefaultTranslationKeys,
> = (args: {
  config: I18nOptions<TTranslations>
  language?: string
  translations: Language<TTranslations>['translations']
}) => {
  t: TFunction<TTranslationKeys>
  translations: Language<TTranslations>['translations']
}

export type InitI18n =
  | ((args: { config: I18nOptions; context: 'api'; language: AcceptedLanguages }) => Promise<I18n>)
  | ((args: {
      config: I18nOptions<ClientTranslationsObject>
      context: 'client'
      language: AcceptedLanguages
    }) => Promise<I18n<ClientTranslationsObject, ClientTranslationKeys>>)

export type LanguagePreference = {
  language: AcceptedLanguages
  quality?: number
}

export type I18nClient<TAdditionalTranslations = {}, TAdditionalKeys extends string = never> = I18n<
  TAdditionalTranslations extends object
    ? ClientTranslationsObject & TAdditionalTranslations
    : ClientTranslationsObject,
  [TAdditionalKeys] extends [never]
    ? ClientTranslationKeys
    : ClientTranslationKeys | TAdditionalKeys
>
export type I18nServer<TAdditionalTranslations = {}, TAdditionalKeys extends string = never> = I18n<
  TAdditionalTranslations extends object
    ? DefaultTranslationsObject & TAdditionalTranslations
    : DefaultTranslationsObject,
  [TAdditionalKeys] extends [never]
    ? DefaultTranslationKeys
    : DefaultTranslationKeys | TAdditionalKeys
>
