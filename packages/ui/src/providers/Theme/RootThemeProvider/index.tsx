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
  /** Initial theme, with a fixed admin theme taking precedence over cookies and query preferences. */
  theme?: Theme
}

/**
 * The Admin mounts one `RootThemeProvider` per app.
 * It alone reads and writes preference cookies, detects system preferences, and updates `<html>` attributes.
 *
 * Nest `ThemeProvider`s for local overrides.
 * Use `useRootTheme` to escape local overrides and access root preferences.
 *
 * @example
 * Outside a nested provider, `useTheme` reads and updates the root theme.
 *
 * ```tsx
 * function MyComponent() {
 *   const { setTheme } = useTheme()
 *   return <button type="button" onClick={() => setTheme('dark')}>Use dark theme</button>
 * }
 *
 * <RootThemeProvider theme="light">
 *   <MyComponent />
 * </RootThemeProvider>
 * ```
 *
 * @see `ThemeProvider` for managing nested theme scopes.
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

  const [theme, _setTheme] = useState<Theme>(themeOverride ?? defaultTheme)

  const [autoMode, setAutoMode] = useState<boolean>(true)

  const [highContrastMode, _setHighContrastMode] = useState<boolean>(
    initialHighContrastMode ?? false,
  )

  /**
   * Sets the root `<html>` element's `data-theme` HTML attribute and saves the preference to cookies.
   * `'auto'` uses the system theme and clears the theme cookie.
   */
  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme) => {
      const resolvedTheme = themeToSet === 'auto' ? getThemeFromSystem() : themeToSet

      _setTheme(resolvedTheme)
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
   * Sets the root `<html>` element's `data-enhanced-contrast` HTML attribute and saves the preference to cookies.
   */
  const setHighContrastMode = useCallback(
    (isHighContrast: boolean) => {
      _setHighContrastMode(isHighContrast)

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

  useEffect(
    function syncThemeFromPreferences() {
      if (preselectedTheme !== 'all') {
        return
      }

      if (isValidThemeParam(themeParam)) {
        setTheme(themeParam)
        return
      }

      const { isAutoMode, theme: detectedTheme } = detectTheme({ cookieKey: themeCookieKey })

      document.documentElement.setAttribute('data-theme', detectedTheme)

      _setTheme(detectedTheme)
      setAutoMode(isAutoMode)
    },
    [preselectedTheme, themeCookieKey, themeParam, setTheme],
  )

  useEffect(
    function syncHighContrastFromPreferences() {
      const isHighContrast = detectHighContrastMode({ cookieKey: contrastCookieKey })

      document.documentElement.toggleAttribute('data-enhanced-contrast', isHighContrast)

      _setHighContrastMode(isHighContrast)
    },
    [contrastCookieKey],
  )

  const context = useMemo(
    () => ({ autoMode, highContrastMode, setHighContrastMode, setTheme, theme }),
    [autoMode, highContrastMode, setHighContrastMode, setTheme, theme],
  )

  return (
    <RootContext value={context}>
      <Context value={context}>{children}</Context>
    </RootContext>
  )
}
