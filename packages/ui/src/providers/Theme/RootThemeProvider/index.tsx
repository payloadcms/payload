'use client'
import { generateCookie } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { Theme } from '../shared.js'

import { useConfig } from '../../Config/index.js'
import { useSearchParams } from '../../RouterAdapter/index.js'
import { Context, RootContext } from '../context.js'
import { defaultTheme, highContrastModeCookieSuffix, themeCookieSuffix } from '../shared.js'
import {
  detectHighContrastMode,
  detectTheme,
  getThemeFromSystem,
  isValidThemeParam,
} from '../utilities.js'

type RootThemeProviderProps = {
  children?: React.ReactNode
  /** Initial contrast preference, resolved from cookies or system settings after mounting. */
  highContrastMode?: boolean
  /** Initial theme; a fixed admin theme takes precedence over cookies and query preferences. */
  theme?: Theme
}

/**
 * Theme providers can be nested, but only this root provider reads and writes cookies, detects system preferences, and updates theme and contrast attributes on `<html>`.
 * `setTheme` writes the resolved theme to `data-theme` on the document's `<html>` element.
 *
 * The Admin mounts it explicitly to manage its theme preferences.
 * `useTheme` reads and updates these preferences until a local ThemeProvider is introduced.
 * Inside a local scope, use `useRootTheme` to read or change the root preferences.
 *
 * @example
 * In the Admin, `useTheme` controls root preferences outside nested providers.
 * ```tsx
 * function ThemeButton() {
 *   const { setTheme } = useTheme()
 *   return <button type="button" onClick={() => setTheme('dark')}>Use dark theme</button>
 * }
 * ```
 */
export const RootThemeProvider: React.FC<RootThemeProviderProps> = ({
  children,
  highContrastMode: initialHighContrastMode,
  theme: themeOverride,
}) => {
  const { config } = useConfig()
  const preselectedTheme = config.admin.theme
  const themeCookieKey = `${config.cookiePrefix}${themeCookieSuffix}`
  const contrastCookieKey = `${config.cookiePrefix}${highContrastModeCookieSuffix}`

  const themeParam = useSearchParams().get('theme')?.toLowerCase()

  const [theme, setThemeState] = useState<Theme>(themeOverride ?? defaultTheme)
  const [autoMode, setAutoMode] = useState<boolean>(true)
  const [highContrastMode, setHighContrastModeState] = useState<boolean>(
    initialHighContrastMode ?? false,
  )

  /**
   * Sets the theme on `<html>` and saves your choice for a year.
   * `'auto'` uses the system theme and clears the theme cookie.
   */
  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme) => {
      const resolvedTheme = themeToSet === 'auto' ? getThemeFromSystem() : themeToSet

      setThemeState(resolvedTheme)
      setAutoMode(themeToSet === 'auto')
      document.cookie = generateCookie<false>({
        name: themeCookieKey,
        maxAge: themeToSet === 'auto' ? -1 : 60 * 60 * 24 * 365,
        path: '/',
        returnCookieAsObject: false,
        value: themeToSet,
      })
      document.documentElement.setAttribute('data-theme', resolvedTheme)
    },
    [themeCookieKey],
  )

  /**
   * Sets contrast on `<html>` and saves your choice for a year, including when it's off.
   */
  const setHighContrastMode = useCallback(
    (isHighContrast: boolean) => {
      setHighContrastModeState(isHighContrast)
      document.cookie = generateCookie<false>({
        name: contrastCookieKey,
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        returnCookieAsObject: false,
        value: String(isHighContrast),
      })
      document.documentElement.toggleAttribute('data-enhanced-contrast', isHighContrast)
    },
    [contrastCookieKey],
  )

  useEffect(() => {
    if (preselectedTheme !== 'all') {
      return
    }

    if (isValidThemeParam(themeParam)) {
      setTheme(themeParam)
      return
    }

    const { isAutoMode, theme: detectedTheme } = detectTheme({ cookieKey: themeCookieKey })

    document.documentElement.setAttribute('data-theme', detectedTheme)
    setThemeState(detectedTheme)
    setAutoMode(isAutoMode)
  }, [preselectedTheme, themeCookieKey, themeParam, setTheme])

  useEffect(() => {
    const isHighContrast = detectHighContrastMode({ cookieKey: contrastCookieKey })

    document.documentElement.toggleAttribute('data-enhanced-contrast', isHighContrast)
    setHighContrastModeState(isHighContrast)
  }, [contrastCookieKey])

  const value = useMemo(
    () => ({ autoMode, highContrastMode, setHighContrastMode, setTheme, theme }),
    [autoMode, highContrastMode, setHighContrastMode, setTheme, theme],
  )

  return (
    <RootContext value={value}>
      <Context value={value}>{children}</Context>
    </RootContext>
  )
}
