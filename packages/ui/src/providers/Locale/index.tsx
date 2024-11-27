'use client'

import type { Locale } from 'payload'

import React, { createContext, useContext, useEffect, useState } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { usePreferences } from '../Preferences/index.js'
import { useSearchParams } from '../SearchParams/index.js'

const LocaleContext = createContext({} as Locale)

export const LocaleProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const {
    config: { localization = false },
  } = useConfig()

  const { user } = useAuth()
  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'

  const { getPreference, setPreference } = usePreferences()
  const { searchParams } = useSearchParams()
  const localeFromParams = searchParams?.locale as string

  const [localeCode, setLocaleCode] = useState<string>(defaultLocale)

  const locale: Locale | null = React.useMemo(() => {
    if (!localization) {
      return null
    }

    return (
      findLocaleFromCode(localization, localeFromParams || localeCode) ||
      findLocaleFromCode(localization, defaultLocale)
    )
  }, [localeCode, localeFromParams, localization, defaultLocale])

  useEffect(() => {
    async function setInitialLocale() {
      if (localization && user) {
        if (typeof localeFromParams !== 'string') {
          try {
            const localeToSet = await getPreference<string>('locale')
            setLocaleCode(localeToSet)
          } catch (_) {
            setLocaleCode(defaultLocale)
          }
        } else {
          void setPreference(
            'locale',
            findLocaleFromCode(localization, localeFromParams)?.code || defaultLocale,
          )
        }
      }
    }

    void setInitialLocale()
  }, [defaultLocale, getPreference, localization, localeFromParams, setPreference, user])

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/**
 * A hook that returns the current locale object.
 */
export const useLocale = (): Locale => useContext(LocaleContext)
