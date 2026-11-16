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
 * Use one `RootThemeProvider` per document, with nested `ThemeProvider`s as needed.
 * The root scope reads and writes cookies, detects system preferences, and writes HTML attributes directly to the document's `<html>` element.
 *
 * @example
 * ```tsx
 * <html data-theme="light" data-enhanced-contrast="true">
 *   {
 *     // ...
 *   }
 * </html>
 * ```
 *
 * The admin panel mounts the `RootThemeProvider` at the top-level to manage its site-wide theme preferences.
 * - Use `useTheme` to read and update the nearest theme scope, which may be the `RootThemeProvider` or the nearest nested `ThemeProvider`.
 * - Within a nested `ThemeProvider`, use `useRootTheme` to step outside the nested context to read and update the root theme.
 *
 * @example
 * Inside the `RootThemeProvider` scope, `useTheme` controls the root preferences until a nested provider is introduced.
 * It interacts with the system preference and cookies to determine the effective theme.
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
 * @see `ThemeProvider` for managing nested theme scopes within the root provider.
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
   * Sets the theme on `<html>` and saves to cookies.
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
   * Sets contrast on `<html>` and saves to cookies.
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
