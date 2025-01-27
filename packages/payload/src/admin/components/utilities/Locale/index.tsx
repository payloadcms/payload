import React, { createContext, useContext, useEffect, useState } from 'react'

import type { Locale } from '../../../../config/types'

import { findLocaleFromCode } from '../../../../utilities/findLocaleFromCode'
import { useAuth } from '../Auth'
import { useConfig } from '../Config'
import { usePreferences } from '../Preferences'
import { useSearchParams } from '../SearchParams'

const LocaleContext = createContext({} as Locale)

export const LocaleProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { localization } = useConfig()

  const { refreshPermissions, user } = useAuth()
  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'
  const searchParams = useSearchParams()
  const [localeCode, setLocaleCode] = useState<string>(
    (searchParams?.locale as string) || defaultLocale,
  )
  const [locale, setLocale] = useState<Locale | null>(
    localization && findLocaleFromCode(localization, localeCode),
  )
  const { getPreference, setPreference } = usePreferences()
  const localeFromParams = searchParams.locale

  const handleLocaleChange = React.useCallback(
    (newLocaleCode: string) => {
      if (!localization) return

      if (localization.localeCodes.indexOf(newLocaleCode) > -1) {
        setLocaleCode(newLocaleCode)
        setLocale(findLocaleFromCode(localization, newLocaleCode))
        if (user) {
          void setPreference('locale', newLocaleCode)
          void refreshPermissions({ locale: newLocaleCode })
        }
      }
    },
    [localization, setPreference, user, refreshPermissions],
  )

  useEffect(() => {
    if (!localization) {
      return
    }

    // set locale from search param
    if (localeFromParams && localization.localeCodes.indexOf(localeFromParams as string) > -1) {
      handleLocaleChange(localeFromParams as string)
      return
    }

    // set locale from preferences or default
    const initializeLocale = async () => {
      let preferenceLocale: string
      if (user) {
        preferenceLocale = await getPreference<string>('locale')
        handleLocaleChange(preferenceLocale)
        return
      }
      handleLocaleChange(defaultLocale)
    }

    void initializeLocale()
  }, [defaultLocale, getPreference, handleLocaleChange, localeFromParams, localization, user])

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/**
 * A hook that returns the current locale object.
 */
export const useLocale = (): Locale => useContext(LocaleContext)

export default LocaleContext
