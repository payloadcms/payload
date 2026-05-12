'use client'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'

import { useConfig } from '../Config/index.js'

export type Theme = 'dark' | 'light'

export type ThemeContext = {
  autoMode: boolean
  highContrastMode: boolean
  setHighContrastMode: (isHighContrast: boolean) => void
  setTheme: (theme: 'auto' | Theme) => void
  theme: Theme
}

const initialContext: ThemeContext = {
  autoMode: true,
  highContrastMode: false,
  setHighContrastMode: () => null,
  setTheme: () => null,
  theme: 'light',
}

const Context = createContext(initialContext)

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

export const ThemeProvider: React.FC<{
  children?: React.ReactNode
  highContrastMode?: boolean
  theme?: Theme
}> = ({ children, highContrastMode: initialHighContrastMode, theme: initialTheme }) => {
  const { config } = useConfig()

  const preselectedTheme = config.admin.theme
  const themeCookieKey = `${config.cookiePrefix || 'payload'}-theme`
  const contrastCookieKey = `${config.cookiePrefix || 'payload'}-high-contrast-mode`

  const [theme, setThemeState] = useState<Theme>(initialTheme || defaultTheme)
  const [autoMode, setAutoMode] = useState<boolean>(true)
  const [highContrastMode, setHighContrastModeState] = useState<boolean>(
    initialHighContrastMode ?? false,
  )

  useEffect(() => {
    if (preselectedTheme !== 'all') {
      return
    }
    const { isAutoMode, theme: detectedTheme } = detectTheme(themeCookieKey)
    setThemeState(detectedTheme)
    setAutoMode(isAutoMode)
  }, [preselectedTheme, themeCookieKey])

  useEffect(() => {
    setHighContrastModeState(detectHighContrastMode(contrastCookieKey))
  }, [contrastCookieKey])

  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme) => {
      if (themeToSet === 'light' || themeToSet === 'dark') {
        setThemeState(themeToSet)
        setAutoMode(false)
        setCookie(themeCookieKey, themeToSet, 365)
        document.documentElement.setAttribute('data-theme', themeToSet)
      } else if (themeToSet === 'auto') {
        setCookie(themeCookieKey, themeToSet, -1)
        const themeFromOS =
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        document.documentElement.setAttribute('data-theme', themeFromOS)
        setAutoMode(true)
        setThemeState(themeFromOS)
      }
    },
    [themeCookieKey],
  )

  const setHighContrastMode = useCallback(
    (isHighContrast: boolean) => {
      setHighContrastModeState(isHighContrast)
      setCookie(contrastCookieKey, String(isHighContrast), 365)
      if (isHighContrast) {
        document.documentElement.setAttribute('data-enhanced-contrast', '')
      } else {
        document.documentElement.removeAttribute('data-enhanced-contrast')
      }
    },
    [contrastCookieKey],
  )

  return (
    <Context value={{ autoMode, highContrastMode, setHighContrastMode, setTheme, theme }}>
      {children}
    </Context>
  )
}

export const useTheme = (): ThemeContext => use(Context)
