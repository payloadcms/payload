'use client'

import type { Locale } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React, { createContext, use, useEffect, useRef, useState } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { useSearchParams } from '../RouterAdapter/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'

const LocaleContext = createContext<Locale | null>(null)

export const LocaleLoadingContext = createContext({
  localeIsLoading: false,
  setLocaleIsLoading: (_: boolean) => undefined,
})

const fetchPreferences = async <T extends Record<string, unknown> | string>(
  key: string,
  baseURL: string,
): Promise<{ id: string; value: T }> =>
  await fetch(`${baseURL}/payload-preferences/${key}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })?.then((res) => res.json() as Promise<{ id: string; value: T }>)

/** @internal */
export const LocaleProvider: React.FC<{ children?: React.ReactNode; locale?: Locale['code'] }> = ({
  children,
  /**
    The `locale` prop originates from the root layout, which does not have access to search params
    This component uses the `useSearchParams` hook to get the locale from the URL as precedence over this prop
    This prop does not update as the user navigates the site, because the root layout does not re-render
  */
  locale: initialLocaleFromPrefs,
}) => {
  const {
    config: {
      localization = false,
      routes: { api: apiRoute },
    },
  } = useConfig()

  const { user } = useAuth()
  const { isTransitioning } = useRouteTransition()

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

  useEffect(() => {
    // Keep fields disabled until the new locale's document state finishes loading.
    if (locale?.code !== prevLocale.current?.code && !isTransitioning) {
      setLocaleIsLoading(false)
      prevLocale.current = locale
    }
  }, [isTransitioning, locale])

  const fetchURL = formatAdminURL({
    apiRoute,
    path: '',
  })

  useEffect(() => {
    /**
     * This effect should only run when `localeFromParams` changes, i.e. when the user clicks an anchor link
     * The root layout, which sends the initial locale from prefs, will not re-render as the user navigates the site
     * For this reason, we need to fetch the locale from prefs if the search params clears the `locale` query param
     */
    async function resetLocale() {
      if (localization && user?.id) {
        const localeToUse =
          localeFromParams ||
          (await fetchPreferences<Locale['code']>('locale', fetchURL)?.then((res) => res.value))

        const newLocale =
          findLocaleFromCode(localization, localeToUse) ||
          findLocaleFromCode(localization, defaultLocale) ||
          findLocaleFromCode(localization, localization?.locales?.[0]?.code)

        if (newLocale) {
          setLocale(newLocale)
        }
      }
    }

    void resetLocale()
  }, [defaultLocale, localization, fetchURL, localeFromParams, user?.id])

  return (
    <LocaleContext value={locale}>
      <LocaleLoadingContext value={{ localeIsLoading: isLoading, setLocaleIsLoading }}>
        {children}
      </LocaleLoadingContext>
    </LocaleContext>
  )
}

export const useLocaleLoading = () => use(LocaleLoadingContext)

export const useLocale = (): Locale | null => use(LocaleContext)
