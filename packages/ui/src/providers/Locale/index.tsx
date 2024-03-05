'use client'

import type { Locale } from 'payload/config'

// TODO: abstract the `next/navigation` dependency out from this component
import { useRouter } from 'next/navigation'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { usePreferences } from '../Preferences/index.js'
import { useSearchParams } from '../SearchParams/index.js'

const LocaleContext = createContext({} as Locale)

export const LocaleProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { localization } = useConfig()

  const { user } = useAuth()

  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'

  const { dispatchSearchParams, searchParams } = useSearchParams()
  const router = useRouter()

  const [localeCode, setLocaleCode] = useState<string>(
    (searchParams?.locale as string) || defaultLocale,
  )

  const [locale, setLocale] = useState<Locale | null>(
    localization && findLocaleFromCode(localization, localeCode),
  )

  const { getPreference, setPreference } = usePreferences()

  const localeFromParams = searchParams.locale

  useEffect(() => {
    async function localeChangeHandler() {
      if (!localization) {
        return
      }

      // set locale from search param
      if (localeFromParams && localization.localeCodes.indexOf(localeFromParams as string) > -1) {
        setLocaleCode(localeFromParams as string)
        setLocale(findLocaleFromCode(localization, localeFromParams as string))
        if (user) await setPreference('locale', localeFromParams)
        return
      }

      // set locale from preferences or default
      let preferenceLocale: string
      let isPreferenceInConfig: boolean
      if (user) {
        preferenceLocale = await getPreference<string>('locale')
        isPreferenceInConfig =
          preferenceLocale && localization.localeCodes.indexOf(preferenceLocale) > -1
        if (isPreferenceInConfig) {
          setLocaleCode(preferenceLocale)
          setLocale(findLocaleFromCode(localization, preferenceLocale))
          return
        }
        await setPreference('locale', defaultLocale)
      }
      setLocaleCode(defaultLocale)
      setLocale(findLocaleFromCode(localization, defaultLocale))
    }

    void localeChangeHandler()
  }, [defaultLocale, getPreference, localeFromParams, setPreference, user, localization, router])

  useEffect(() => {
    if (searchParams?.locale) {
      dispatchSearchParams({
        type: 'set',
        params: {
          locale: searchParams.locale,
        },
      })
    }
  }, [searchParams.locale, dispatchSearchParams])

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/**
 * A hook that returns the current locale object.
 */
export const useLocale = (): Locale => useContext(LocaleContext)

export default LocaleContext
