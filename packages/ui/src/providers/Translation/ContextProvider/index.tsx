'use client'
import type { I18nClient, I18nOptions, Language } from '@payloadcms/translations'
import type { Locale } from 'date-fns'
import type { LanguageOptions } from 'payload'

import { importDateFNSLocale, t } from '@payloadcms/translations'
import { enUS } from 'date-fns/locale/en-US'
import React, { useEffect, useState } from 'react'

import type { TranslationContextType } from '../context.js'

import { TranslationContext } from '../context.js'

export { useTranslation } from '../context.js'

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
  onLanguageChange?: TranslationContextType['switchLanguage']
  translations: I18nClient['translations']
}

/**
 * Provides a shared translation context for native Payload components and custom UI, including standalone integrations such as visual editing.
 *
 * Must remain independent of admin routing and server functions because standalone consumers do not have the admin provider tree.
 * Keep admin language persistence and navigation in `TranslationProvider`; use `onLanguageChange` for integration callbacks.
 */
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

  const nextT: TranslationContextType['t'] = React.useCallback(
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
    <TranslationContext
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
    </TranslationContext>
  )
}
