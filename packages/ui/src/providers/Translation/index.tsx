'use client'
import type { I18n, Language } from '@payloadcms/translations'
import type { Locale } from 'date-fns'
import type { ClientConfig } from 'payload/types'

import { t } from '@payloadcms/translations'
import { importDateFNSLocale } from '@payloadcms/translations'
import enUS from 'date-fns/locale/en-US'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { useRouteCache } from '../RouteCache/index.js'

export type LanguageOptions = {
  label: string
  value: string
}[]

const Context = createContext<{
  i18n: I18n
  languageOptions: LanguageOptions
  switchLanguage?: (lang: string) => Promise<void>
  t: (key: string, vars?: Record<string, any>) => string
}>({
  i18n: {
    dateFNS: enUS,
    dateFNSKey: 'en-US',
    fallbackLanguage: 'en',
    language: 'en',
    t: (key) => key,
    translations: {},
  },
  languageOptions: undefined,
  switchLanguage: undefined,
  t: (key) => key,
})

type Props = {
  children: React.ReactNode
  dateFNSKey: Language['dateFNSKey']
  fallbackLang: ClientConfig['i18n']['fallbackLanguage']
  language: string
  languageOptions: LanguageOptions
  switchLanguageServerAction: (lang: string) => Promise<void>
  translations: Language['translations']
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
  const { clearRouteCache } = useRouteCache()
  const [dateFNS, setDateFNS] = useState<Locale>()

  const nextT = (key: string, vars?: Record<string, unknown>): string =>
    t({
      key,
      translations,
      vars,
    })

  const switchLanguage = React.useCallback(
    async (lang: string) => {
      try {
        await switchLanguageServerAction(lang)
        clearRouteCache()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error loading language: "${lang}"`, error)
      }
    },
    [switchLanguageServerAction, clearRouteCache],
  )

  useEffect(() => {
    const loadDateFNS = async () => {
      const imported = await importDateFNSLocale(dateFNSKey)

      setDateFNS(imported)
    }

    void loadDateFNS()
  }, [dateFNSKey])

  return (
    <Context.Provider
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
    </Context.Provider>
  )
}

export const useTranslation = () => useContext(Context)
