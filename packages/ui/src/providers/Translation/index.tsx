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
  i18n: Omit<I18n, 'translations'>
  languageOptions: LanguageOptions
  switchLanguage?: (lang: string) => Promise<void>
  t: (key: string, vars?: Record<string, any>) => string
}>({
  i18n: {
    fallbackLanguage: 'en',
    language: 'en',
    t: (key) => key,
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
  loadLanguageTranslations?: (lang: string) => Promise<LanguageTranslations>
  translations: LanguageTranslations
}

export const TranslationProvider: React.FC<Props> = ({
  children,
  fallbackLang,
  lang: langFromProps,
  languageOptions,
  loadLanguageTranslations: loadLanguageAction,
  translations: translationsFromProps,
}) => {
  const [language, setLanguage] = React.useState(langFromProps)
  const [translations, setTranslations] =
    React.useState<LanguageTranslations>(translationsFromProps)

  const loadedLanguageRef = React.useRef<Record<string, LanguageTranslations>>({
    [langFromProps]: translationsFromProps,
  })

  const nextT = React.useCallback(
    (key: string, vars?: Record<string, any>): string =>
      t({
        key,
        translations,
        vars,
      }),
    [translations],
  )

  const switchLanguage = React.useCallback(
    async (lang: string) => {
      if (loadedLanguageRef.current?.[lang]) {
        setTranslations(loadedLanguageRef.current[lang])
        return
      }

      const loaded = await loadLanguageAction(lang)
      loadedLanguageRef.current[lang] = loaded
      setTranslations(loaded)
      setLanguage(lang)
    },
    [loadLanguageAction],
  )

  return (
    <Context.Provider
      value={{
        i18n: {
          fallbackLanguage: fallbackLang,
          language,
          t: nextT,
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
