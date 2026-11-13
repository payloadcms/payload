'use client'
import type {
  AcceptedLanguages,
  ClientTranslationKeys,
  ClientTranslationsObject,
  I18nClient,
  I18nOptions,
  Language,
  TFunction,
} from '@payloadcms/translations'
import type { Locale } from 'date-fns'
import type { LanguageOptions } from 'payload'

import { importDateFNSLocale, t } from '@payloadcms/translations'
import { enUS } from 'date-fns/locale/en-US'
import React, { createContext, use, useEffect, useState } from 'react'

type ContextType<
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

const Context = createContext<ContextType<any, any>>({
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

export type TranslationContextProviderProps = {
  children: React.ReactNode
  dateFNSKey: Language['dateFNSKey']
  fallbackLang: I18nOptions['fallbackLanguage']
  language: string
  languageOptions: LanguageOptions
  /**
   * Handles language changes requested by consumers.
   * Update the provider props to apply the new language.
   */
  onLanguageChange?: ContextType['switchLanguage']
  translations: I18nClient['translations']
}

export const TranslationContextProvider: React.FC<TranslationContextProviderProps> = ({
  children,
  dateFNSKey,
  fallbackLang,
  language,
  languageOptions,
  onLanguageChange,
  translations,
}) => {
  const [dateFNS, setDateFNS] = useState<Locale>()

  const nextT: ContextType['t'] = React.useCallback(
    (key, vars): string =>
      t({
        key,
        translations,
        vars,
      }),
    [translations],
  )

  useEffect(() => {
    // en-US is date-fns' default locale, so it's already part of the bundle
    if (dateFNSKey === 'en-US') {
      setDateFNS(enUS)
      return
    }

    let isCancelled = false
    const loadDateFNS = async () => {
      const imported = await importDateFNSLocale(dateFNSKey)

      if (!isCancelled) {
        setDateFNS(imported)
      }
    }

    void loadDateFNS()

    return () => {
      isCancelled = true
    }
  }, [dateFNSKey])

  return (
    <Context
      value={{
        i18n: {
          dateFNS,
          dateFNSKey,
          fallbackLanguage: fallbackLang,
          language,
          t: nextT,
          translations,
        },
        languageOptions,
        switchLanguage: onLanguageChange,
        t: nextT,
      }}
    >
      {children}
    </Context>
  )
}

export const useTranslation = <
  TAdditionalTranslations = {},
  TAdditionalClientTranslationKeys extends string = never,
>() => use<ContextType<TAdditionalTranslations, TAdditionalClientTranslationKeys>>(Context)
