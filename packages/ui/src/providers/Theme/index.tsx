'use client'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'

import { useConfig } from '../Config/index.js'

export type Theme = 'dark' | 'light'

export type ThemeContext = {
  autoMode: boolean
  highContrastMode: boolean
  setHighContrastMode: (isHighContrast: boolean, options?: { scoped?: boolean }) => void
  setTheme: (theme: 'auto' | Theme, options?: { scoped?: boolean }) => void
  theme: Theme
}

const initialContext: ThemeContext = {
  autoMode: true,
  highContrastMode: false,
  setHighContrastMode: () => null,
  setTheme: () => null,
  theme: 'light',
}

const Context = createContext<ThemeContext | undefined>(undefined)

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

  if (isHighContrast) {
    document.documentElement.setAttribute('data-enhanced-contrast', '')
  } else {
    document.documentElement.removeAttribute('data-enhanced-contrast')
  }

  return isHighContrast
}

export const defaultTheme: Theme = 'light'

/**
 * Provides theme context to its children.
 *
 * At the root (no parent ThemeProvider): reads/writes cookies, responds to
 * OS preference, owns setTheme and setHighContrastMode.
 *
 * When nested inside another ThemeProvider (e.g. inside a Popup): acts as a
 * scoped visual  the `theme` prop sets the local theme, but setThemeoverride
 * and setHighContrastMode bubble up through each level to the root provider so
 * mutations always affect the global user preference.
 */
export const ThemeProvider: React.FC<{
  children?: React.ReactNode
  highContrastMode?: boolean
  theme?: Theme
}> = ({ children, highContrastMode: initialHighContrastMode, theme: themeOverride }) => {
  const outerContext = use(Context)
  const isScoped = outerContext !== undefined

  const { config } = useConfig()
  const preselectedTheme = config.admin.theme
  const themeCookieKey = `${config.cookiePrefix || 'payload'}-theme`
  const contrastCookieKey = `${config.cookiePrefix || 'payload'}-high-contrast-mode`

  const [theme, setThemeState] = useState<Theme>(themeOverride ?? defaultTheme)
  const [autoMode, setAutoMode] = useState<boolean>(!isScoped)
  const [highContrastMode, setHighContrastModeState] = useState<boolean>(
    isScoped ? (outerContext.highContrastMode ?? false) : (initialHighContrastMode ?? false),
  )

  // Keep highContrastMode in sync with the outer provider when scoped.
  useEffect(() => {
    if (isScoped) {
      setHighContrastModeState(outerContext.highContrastMode)
    }
  }, [isScoped, outerContext?.highContrastMode])

  useEffect(() => {
    if (isScoped || preselectedTheme !== 'all') {
      return
    }
    const { isAutoMode, theme: detectedTheme } = detectTheme(themeCookieKey)
    setThemeState(detectedTheme)
    setAutoMode(isAutoMode)
  }, [isScoped, preselectedTheme, themeCookieKey])

  useEffect(() => {
    if (isScoped) {
      return
    }
    setHighContrastModeState(detectHighContrastMode(contrastCookieKey))
  }, [isScoped, contrastCookieKey])

  // Setters bubble up to the root provider by default. Pass { scoped: true }
  // to update only the local (scoped) theme without affecting global state.
  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme, options?: { scoped?: boolean }) => {
      if (isScoped && !options?.scoped) {
        outerContext.setTheme(themeToSet, options)
        return
      }
      const resolvedTheme: Theme =
        themeToSet === 'auto'
          ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : themeToSet

      setThemeState(resolvedTheme)
      setAutoMode(themeToSet === 'auto')

      if (!isScoped) {
        setCookie(themeCookieKey, themeToSet, themeToSet === 'auto' ? -1 : 365)
        document.documentElement.setAttribute('data-theme', resolvedTheme)
      }
    },
    [isScoped, outerContext, themeCookieKey],
  )

  const setHighContrastMode = useCallback(
    (isHighContrast: boolean, options?: { scoped?: boolean }) => {
      if (isScoped && !options?.scoped) {
        outerContext.setHighContrastMode(isHighContrast, options)
        return
      }
      setHighContrastModeState(isHighContrast)
      if (!isScoped) {
        setCookie(contrastCookieKey, String(isHighContrast), 365)
        if (isHighContrast) {
          document.documentElement.setAttribute('data-enhanced-contrast', '')
        } else {
          document.documentElement.removeAttribute('data-enhanced-contrast')
        }
      }
    },
    [isScoped, outerContext, contrastCookieKey],
  )

  return (
    <Context
      value={{
        autoMode: isScoped ? outerContext.autoMode : autoMode,
        highContrastMode,
        setHighContrastMode,
        setTheme,
        theme: isScoped ? outerContext.theme : theme,
      }}
    >
      {children}
    </Context>
  )
}

export const useTheme = (): ThemeContext => use(Context) ?? initialContext
