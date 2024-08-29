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
    config: { localization },
  } = useConfig()

  const { user } = useAuth()
  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'

  const { searchParams } = useSearchParams()
  const localeFromParams = searchParams?.locale

  const [localeCode, setLocaleCode] = useState<string>(
    (localeFromParams as string) || defaultLocale,
  )

  const [locale, setLocale] = useState<Locale | null>(
    localization && findLocaleFromCode(localization, localeCode),
  )

  const { getPreference, setPreference } = usePreferences()

  const switchLocale = React.useCallback(
    async (newLocale: string) => {
      if (!localization) {
        return
      }

      const localeToSet =
        localization.localeCodes.indexOf(newLocale) > -1 ? newLocale : defaultLocale

      if (localeToSet !== localeCode) {
        setLocaleCode(localeToSet)
        setLocale(findLocaleFromCode(localization, localeToSet))
        try {
          if (user) {
            await setPreference('locale', localeToSet)
          }
        } catch (error) {
          // swallow error
        }
      }
    },
    [localization, setPreference, user, defaultLocale, localeCode],
  )

  useEffect(() => {
    async function setInitialLocale() {
      let localeToSet = defaultLocale

      if (typeof localeFromParams === 'string') {
        localeToSet = localeFromParams
      } else if (user) {
        try {
          localeToSet = await getPreference<string>('locale')
        } catch (error) {
          // swallow error
        }
      }

      await switchLocale(localeToSet)
    }

    void setInitialLocale()
  }, [
    defaultLocale,
    getPreference,
    localization,
    localeFromParams,
    setPreference,
    user,
    switchLocale,
  ])

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/**
 * A hook that returns the current locale object.
 */
export const useLocale = (): Locale => useContext(LocaleContext)
