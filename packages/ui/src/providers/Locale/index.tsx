'use client'

import type { Locale } from 'payload'

import { useSearchParams } from 'next/navigation.js'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { usePreferences } from '../Preferences/index.js'

const LocaleContext = createContext({} as Locale)

export const LocaleLoadingContext = createContext({
  localeIsLoading: false,
  setLocaleIsLoading: (_: boolean) => {},
})

export const LocaleProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const {
    config: { localization = false },
  } = useConfig()

  const { user } = useAuth()

  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'

  const { getPreference, setPreference } = usePreferences()
  const searchParams = useSearchParams()
  const localeFromParams = searchParams.get('locale')

  const [locale, setLocale] = React.useState<Locale>(() => {
    if (!localization) {
      // TODO: return null V4
      return {} as Locale
    }

    return (
      findLocaleFromCode(localization, localeFromParams) ||
      findLocaleFromCode(localization, defaultLocale)
    )
  })

  const [isLoading, setLocaleIsLoading] = useState(false)

  const prevLocale = useRef<Locale>(locale)

  useEffect(() => {
    if (locale.code !== prevLocale.current.code) {
      setLocaleIsLoading(false)
    }

    prevLocale.current = locale
  }, [locale])

  useEffect(() => {
    async function setInitialLocale() {
      if (localization && user) {
        if (typeof localeFromParams !== 'string') {
          try {
            const localeToSet = await getPreference<string>('locale')
            setLocale(
              findLocaleFromCode(localization, localeToSet) ||
                findLocaleFromCode(localization, defaultLocale),
            )
          } catch (_) {
            setLocale(findLocaleFromCode(localization, defaultLocale))
          }
        } else {
          const newLocale = findLocaleFromCode(localization, localeFromParams) || locale
          setLocale(newLocale)
          void setPreference('locale', newLocale)
        }
      }
    }

    void setInitialLocale()
  }, [defaultLocale, getPreference, localization, localeFromParams, setPreference, user])

  return (
    <LocaleContext.Provider value={locale}>
      <LocaleLoadingContext.Provider value={{ localeIsLoading: isLoading, setLocaleIsLoading }}>
        {children}
      </LocaleLoadingContext.Provider>
    </LocaleContext.Provider>
  )
}

export const useLocaleLoading = () => useContext(LocaleLoadingContext)

/**
 * TODO: V4
 * The return type of the `useLocale` hook will change in v4. It will return `null | Locale` instead of `false | Locale`.
 */
export const useLocale = (): Locale => useContext(LocaleContext)
