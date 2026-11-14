'use client'
import React, { useCallback, useEffect, useState } from 'react'

import type { ThemeProviderProps } from '../context.js'
import type { Theme } from '../shared.js'

import { useConfig } from '../../Config/index.js'
import { useSearchParams } from '../../RouterAdapter/index.js'
import { Context, RootContext } from '../context.js'
import { defaultTheme } from '../shared.js'

/**
 * Theme providers can be nested, but only this root provider reads and writes cookies, detects system preferences, and updates theme and contrast attributes on `<html>`.
 * It owns the preference state and the setters shared by every provider.
 *
 * `ThemeProvider` creates it when there isn't already a theme context.
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
      const resolvedTheme: Theme =
        themeToSet === 'auto'
          ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : themeToSet

      setThemeState(resolvedTheme)
      setAutoMode(themeToSet === 'auto')
      setCookie(themeCookieKey, themeToSet, themeToSet === 'auto' ? -1 : 365)
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
      setCookie(contrastCookieKey, String(isHighContrast), 365)
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

    const { isAutoMode, theme: detectedTheme } = detectTheme(themeCookieKey)

    setThemeState(detectedTheme)
    setAutoMode(isAutoMode)
  }, [preselectedTheme, themeCookieKey, themeParam, setTheme])

  useEffect(() => {
    setHighContrastModeState(detectHighContrastMode(contrastCookieKey))
  }, [contrastCookieKey])

  const value = { autoMode, highContrastMode, setHighContrastMode, setTheme, theme }

  return (
    <RootContext value={value}>
      <Context value={value}>{children}</Context>
    </RootContext>
  )
}

function setCookie(cname: string, cvalue: string, exdays: number) {
  const d = new Date()
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

const detectTheme = (cookieKey: string): { isAutoMode: boolean; theme: Theme } => {
  const fromCookie = window.document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookieKey}=`))
    ?.split('=')[1]

  const theme: Theme =
    fromCookie === 'light' || fromCookie === 'dark'
      ? fromCookie
      : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

  document.documentElement.setAttribute('data-theme', theme)

  return { isAutoMode: fromCookie !== 'light' && fromCookie !== 'dark', theme }
}

const detectHighContrastMode = (cookieKey: string): boolean => {
  const fromCookie =
    window.document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${cookieKey}=`))
      ?.split('=')[1] ?? null

  const isHighContrast =
    fromCookie === 'true'
      ? true
      : fromCookie === 'false'
        ? false
        : !!(window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches)

  document.documentElement.toggleAttribute('data-enhanced-contrast', isHighContrast)

  return isHighContrast
}

const isValidThemeParam = (value: null | string): value is 'auto' | Theme =>
  value === 'auto' || value === 'light' || value === 'dark'
