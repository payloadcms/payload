'use client'
import React, { createContext, useContext } from 'react'

import { t } from '@payloadcms/translations'
import type { I18n } from '@payloadcms/translations'
import { ClientConfig } from 'payload/types'

export type LanguageOptions = {
  label: string
  value: string
}[]

const Context = createContext<{
  t: (key: string, vars?: Record<string, string | number>) => string
  i18n: I18n
  languageOptions: LanguageOptions
}>({
  t: () => '',
  i18n: {
    language: 'en',
    fallbackLanguage: 'en',
    t: () => '',
  },
  languageOptions: undefined,
})

export type LanguageTranslations = {
  [namespace: string]: {
    [key: string]: string
  }
}
export const TranslationProvider: React.FC<{
  children: React.ReactNode
  translations: LanguageTranslations
  lang: string
  fallbackLang: ClientConfig['i18n']['fallbackLanguage']
  languageOptions: LanguageOptions
}> = ({ children, translations, lang, fallbackLang, languageOptions }) => {
  const nextT = (key: string, vars?: Record<string, string | number>): string =>
    t({
      key,
      vars,
      translations,
    })

  return (
    <Context.Provider
      value={{
        t: nextT,
        i18n: {
          language: lang,
          fallbackLanguage: fallbackLang,
          t: nextT,
        },
        languageOptions,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useTranslation = () => useContext(Context)
