'use client'

import type { Locale } from 'payload'

import { useSearchParams } from 'next/navigation.js'
import React, { createContext, use, useCallback, useEffect, useRef, useState } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { usePreferences } from '../Preferences/index.js'

export const LocaleContext = createContext({} as Locale)

// Separate from LocaleContext so page and drawer scopes can shadow the locale value.
export const LocaleSyncContext = createContext((_code: Locale['code']): void => undefined)

export const LocaleLoadingContext = createContext({
  localeIsLoading: false,
  setLocaleIsLoading: (_: boolean) => undefined,
})

export const LocaleProvider: React.FC<{ children?: React.ReactNode; locale?: Locale['code'] }> = ({
  children,
  /**
    The `locale` prop originates from the root layout, which does not have access to search params
    The URL locale takes precedence when initializing state. During navigation, PageLocaleProvider
    synchronizes the locale resolved for each server-rendered page because the root layout does not re-render.
  */
  locale: initialLocaleFromPrefs,
}) => {
  const {
    config: { localization = false },
  } = useConfig()

  const { user } = useAuth()
  const { setPreference } = usePreferences()

  const defaultLocale = localization ? localization.defaultLocale : 'en'

  const localeFromParams = useSearchParams().get('locale')

  const [locale, setLocale] = React.useState<Locale>(() => {
    if (!localization || (localization && !localization.locales.length)) {
      // TODO: return null V4
      return {} as Locale
    }

    return (
      findLocaleFromCode(localization, localeFromParams) ||
      findLocaleFromCode(localization, initialLocaleFromPrefs) ||
      findLocaleFromCode(localization, defaultLocale) ||
      findLocaleFromCode(localization, localization.locales[0].code)
    )
  })

  const [isLoading, setLocaleIsLoading] = useState(false)

  const prevLocale = useRef<Locale>(locale)
  const pendingPreferenceSync = useRef<Promise<void>>(Promise.resolve())

  const syncLocale = useCallback(
    (code: Locale['code']) => {
      const newLocale = localization ? findLocaleFromCode(localization, code) : null

      if (
        !newLocale ||
        newLocale.code === locale.code ||
        (localeFromParams && localeFromParams !== code)
      ) {
        return
      }

      setLocale(newLocale)

      if (user?.id) {
        pendingPreferenceSync.current = pendingPreferenceSync.current
          .then(() => setPreference<Locale['code']>('locale', code))
          .catch((error) => {
            console.error(error) // eslint-disable-line no-console
          })
      }
    },
    [locale.code, localeFromParams, localization, setPreference, user?.id],
  )

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

  return (
    <LocaleContext value={locale}>
      <LocaleLoadingContext value={{ localeIsLoading: isLoading, setLocaleIsLoading }}>
        <LocaleSyncContext value={syncLocale}>{children}</LocaleSyncContext>
      </LocaleLoadingContext>
    </LocaleContext>
  )
}

export const useLocaleLoading = () => use(LocaleLoadingContext)

/**
 * TODO: V4
 * The return type of the `useLocale` hook will change in v4. It will return `null | Locale` instead of `false | {} | Locale`.
 */
export const useLocale = (): Locale => use(LocaleContext)
