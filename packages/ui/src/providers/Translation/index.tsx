'use client'
import type { I18n, LanguageTranslations } from '@payloadcms/translations'
import type { ClientConfig } from 'payload/types'

import { t } from '@payloadcms/translations'
import React, { createContext, useContext } from 'react'

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
  fallbackLang: ClientConfig['i18n']['fallbackLanguage']
  lang: string
  languageOptions: LanguageOptions
  switchLanguageServerAction?: (lang: string) => Promise<void>
  translations: LanguageTranslations
}

export const TranslationProvider: React.FC<Props> = ({
  children,
  fallbackLang,
  lang,
  languageOptions,
  switchLanguageServerAction,
  translations,
}) => {
  const { clearRouteCache } = useRouteCache()

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

  return (
    <Context.Provider
      value={{
        i18n: {
          fallbackLanguage: fallbackLang,
          language: lang,
          t: nextT,
          translations: {
            [lang]: translations,
          },
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
