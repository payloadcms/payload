'use client'

import type { Locale } from 'payload'

import React, { createContext, use, useCallback, useEffect, useRef, useState } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { usePreferences } from '../Preferences/index.js'
import { useSearchParams } from '../RouterAdapter/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'

export const LocaleContext = createContext<Locale | null>(null)

// Separate from LocaleContext so page and drawer scopes can shadow the locale value.
export const LocaleSyncContext = createContext((_args: { code: Locale['code'] }): void => undefined)

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
  const { isTransitioning } = useRouteTransition()
  const { setPreference } = usePreferences()

  const defaultLocale = localization ? localization.defaultLocale : 'en'

  const localeFromParams = useSearchParams().get('locale')

  const [locale, setLocale] = React.useState<Locale | null>(() => {
    if (!localization || (localization && !localization.locales.length)) {
      return null
    }

    return (
      findLocaleFromCode(localization, localeFromParams) ||
      findLocaleFromCode(localization, initialLocaleFromPrefs) ||
      findLocaleFromCode(localization, defaultLocale) ||
      findLocaleFromCode(localization, localization.locales[0].code)
    )
  })

  const [isLoading, setLocaleIsLoading] = useState(false)

  const prevLocale = useRef<Locale | null>(locale)
  const pendingPreferenceSync = useRef<Promise<void>>(Promise.resolve())

  const syncLocale = useCallback(
    ({ code }: { code: Locale['code'] }) => {
      const newLocale = localization ? findLocaleFromCode(localization, code) : null

      if (
        !newLocale ||
        newLocale.code === locale?.code ||
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
    [locale?.code, localeFromParams, localization, setPreference, user?.id],
  )

  useEffect(() => {
    // Keep fields disabled until the new locale's document state finishes loading.
    if (locale?.code !== prevLocale.current?.code && !isTransitioning) {
      setLocaleIsLoading(false)
      prevLocale.current = locale
    }
  }, [isTransitioning, locale])

  return (
    <LocaleContext value={locale}>
      <LocaleLoadingContext value={{ localeIsLoading: isLoading, setLocaleIsLoading }}>
        <LocaleSyncContext value={syncLocale}>{children}</LocaleSyncContext>
      </LocaleLoadingContext>
    </LocaleContext>
  )
}

export const useLocaleLoading = () => use(LocaleLoadingContext)

export const useLocale = (): Locale | null => use(LocaleContext)
