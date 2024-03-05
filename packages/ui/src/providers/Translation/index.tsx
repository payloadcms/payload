'use client'
import type { I18n, LanguageTranslations } from '@payloadcms/translations'
import type { ClientConfig } from 'payload/types'

import { t } from '@payloadcms/translations'
import React, { createContext, useContext } from 'react'

export type LanguageOptions = {
  label: string
  value: string
}[]

const Context = createContext<{
  i18n: I18n
  languageOptions: LanguageOptions
  t: (key: string, vars?: Record<string, any>) => string
}>({
  i18n: {
    fallbackLanguage: 'en',
    language: 'en',
    t: (key) => key,
    translations: {},
  },
  languageOptions: undefined,
  t: (key) => key,
})

export const TranslationProvider: React.FC<{
  children: React.ReactNode
  fallbackLang: ClientConfig['i18n']['fallbackLanguage']
  lang: string
  languageOptions: LanguageOptions
  translations: LanguageTranslations
}> = ({ children, fallbackLang, lang, languageOptions, translations }) => {
  const nextT = (key: string, vars?: Record<string, any>): string =>
    t({
      key,
      translations,
      vars,
    })

  return (
    <Context.Provider
      value={{
        i18n: {
          fallbackLanguage: fallbackLang,
          language: lang,
          t: nextT,
          translations,
        },
        languageOptions,
        t: nextT,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useTranslation = () => useContext(Context)
