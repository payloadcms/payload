'use client'
import type {
  AcceptedLanguages,
  ClientTranslationKeys,
  ClientTranslationsObject,
  I18nClient,
  TFunction,
} from '@payloadcms/translations'
import type { LanguageOptions } from 'payload'

import { enUS } from 'date-fns/locale/en-US'
import { createContext, use } from 'react'

export type TranslationContextType<
  TAdditionalTranslations = {},
  TAdditionalClientTranslationKeys extends string = never,
> = {
  i18n: [TAdditionalClientTranslationKeys] extends [never]
    ? I18nClient
    : TAdditionalTranslations extends object
      ? I18nClient<TAdditionalTranslations, TAdditionalClientTranslationKeys>
      : I18nClient<ClientTranslationsObject, TAdditionalClientTranslationKeys>
  languageOptions: LanguageOptions
  switchLanguage?: (lang: AcceptedLanguages) => Promise<void>
  t: TFunction<ClientTranslationKeys | Extract<TAdditionalClientTranslationKeys, string>>
}

export const TranslationContext = createContext<TranslationContextType<any, any>>({
  // Use `any` here to be replaced later with a more specific type when used
  i18n: {
    dateFNS: enUS,
    dateFNSKey: 'en-US',
    fallbackLanguage: 'en',
    language: 'en',
    t: (key) => key,
    translations: {} as any,
  },
  languageOptions: undefined,
  switchLanguage: undefined,
  t: (key) => undefined,
})

export const useTranslation = <
  TAdditionalTranslations = {},
  TAdditionalClientTranslationKeys extends string = never,
>() =>
  use<TranslationContextType<TAdditionalTranslations, TAdditionalClientTranslationKeys>>(
    TranslationContext,
  )
