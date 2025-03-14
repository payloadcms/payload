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
import { useRouter } from 'next/navigation.js'
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

type Props = {
  children: React.ReactNode
  dateFNSKey: Language['dateFNSKey']
  fallbackLang: I18nOptions['fallbackLanguage']
  language: string
  languageOptions: LanguageOptions
  switchLanguageServerAction: (lang: string) => Promise<void>
  translations: I18nClient['translations']
}

export const TranslationProvider: React.FC<Props> = ({
  children,
  dateFNSKey,
  fallbackLang,
  language,
  languageOptions,
  switchLanguageServerAction,
  translations,
}) => {
  const router = useRouter()
  const [dateFNS, setDateFNS] = useState<Locale>()

  const nextT: ContextType['t'] = (key, vars): string =>
    t({
      key,
      translations,
      vars,
    })

  const switchLanguage = React.useCallback(
    async (lang: string) => {
      try {
        await switchLanguageServerAction(lang)
        router.refresh()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error loading language: "${lang}"`, error)
      }
    },
    [switchLanguageServerAction, router],
  )

  useEffect(() => {
    const loadDateFNS = async () => {
      const imported = await importDateFNSLocale(dateFNSKey)

      setDateFNS(imported)
    }

    void loadDateFNS()
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
        switchLanguage,
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
