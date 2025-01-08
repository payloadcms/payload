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
  setLocaleIsLoading: (_: boolean) => undefined,
})

export const LocaleProviderClient: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const {
    config: { localization = false },
  } = useConfig()

  const { user } = useAuth()

  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'

  const { getPreference, setPreference } = usePreferences()
  const searchParams = useSearchParams()
  const localeFromParams = searchParams.get('locale')

  const [locale, setLocale] = React.useState<Locale | null>(() => {
    if (!localization) {
      return null
    }

    return findLocaleFromCode(localization, localeFromParams) || null
  })

  const [isLoading, setLocaleIsLoading] = useState(false)

  const prevLocale = useRef<typeof locale>(locale)

  useEffect(() => {
    /**
     * We need to set `isLoading` back to false once the locale is detected to be different
     * This happens when the user clicks an anchor link which appends the `?locale=` query param
     * This triggers a client-side navigation, which re-renders the page with the new locale
     * In Next.js, local state is persisted during this type of navigation because components are not unmounted
     */
    if (locale.code !== prevLocale.current.code) {
      setLocaleIsLoading(false)
    }

    prevLocale.current = locale
  }, [locale])

  useEffect(() => {
    async function resetLocale() {
      if (localization && user?.id) {
        const localeFromPrefs = await getPreference<Locale['code']>('locale')

        const localeToUse = localeFromParams || localeFromPrefs || defaultLocale

        const newLocale =
          findLocaleFromCode(localization, localeToUse) ||
          findLocaleFromCode(localization, defaultLocale)

        setLocale(newLocale)

        if (newLocale.code !== localeFromPrefs) {
          void setPreference('locale', newLocale.code)
        }
      }
    }

    void resetLocale()
  }, [defaultLocale, getPreference, localization, localeFromParams, setPreference, user?.id])

  return (
    <LocaleContext.Provider value={locale}>
      <LocaleLoadingContext.Provider value={{ localeIsLoading: isLoading, setLocaleIsLoading }}>
        {children}
      </LocaleLoadingContext.Provider>
    </LocaleContext.Provider>
  )
}

export const useLocaleLoading = () => useContext(LocaleLoadingContext)

export const useLocale = (): Locale | null => useContext(LocaleContext)
