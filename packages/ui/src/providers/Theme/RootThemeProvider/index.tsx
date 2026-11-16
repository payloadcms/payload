'use client'
import React, { useCallback, useEffect, useState } from 'react'

import type { ThemeProviderProps } from '../context.js'
import type { Theme } from '../shared.js'

import { useConfig } from '../../Config/index.js'
import { useSearchParams } from '../../RouterAdapter/index.js'
import { Context, RootContext } from '../context.js'
import { defaultTheme } from '../shared.js'
import {
  detectHighContrastMode,
  detectTheme,
  getThemeFromSystem,
  isValidThemeParam,
  setCookie,
} from '../utilities.js'

/**
 * Theme providers can be nested, but only this root provider reads and writes cookies, detects system preferences, and updates theme and contrast attributes on `<html>`.
 * It owns the preference state and the setters shared by providers beneath it.
 *
 * The Admin mounts it explicitly to manage its theme preferences.
 * Nested providers can override the values their children read, but their setters still update the root preference.
 */
export const RootThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  highContrastMode: initialHighContrastMode,
  theme: themeOverride,
}) => {
  const { config } = useConfig()
  const preselectedTheme = config.admin.theme
  const themeCookieKey = `${config.cookiePrefix}-theme`
  const contrastCookieKey = `${config.cookiePrefix}-high-contrast-mode`

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

  const value = { autoMode, highContrastMode, setHighContrastMode, setTheme, theme }

  return (
    <RootContext value={value}>
      <Context value={value}>{children}</Context>
    </RootContext>
  )
}
