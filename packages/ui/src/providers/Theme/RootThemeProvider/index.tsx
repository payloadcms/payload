'use client'
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
  setCookie,
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
   * Updates the resolved theme, automatic mode state, and the document's `data-theme` attribute.
   * Saves an explicit theme in the cookie for a year, or removes the cookie when automatic mode is selected.
   */
  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme) => {
      const resolvedTheme = themeToSet === 'auto' ? getThemeFromSystem() : themeToSet

      setThemeState(resolvedTheme)
      setAutoMode(themeToSet === 'auto')
      setCookie({
        cookieKey: themeCookieKey,
        days: themeToSet === 'auto' ? -1 : 365,
        value: themeToSet,
      })
      document.documentElement.setAttribute('data-theme', resolvedTheme)
    },
    [themeCookieKey],
  )

  /**
   * Updates the high contrast state and toggles the document's `data-enhanced-contrast` attribute to match.
   * Saves the selected boolean in the contrast cookie for a year, including when contrast is disabled.
   */
  const setHighContrastMode = useCallback(
    (isHighContrast: boolean) => {
      setHighContrastModeState(isHighContrast)
      setCookie({ cookieKey: contrastCookieKey, days: 365, value: String(isHighContrast) })
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
