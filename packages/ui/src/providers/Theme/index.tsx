'use client'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

export type ThemeContext = {
  autoMode: boolean
  setTheme: (theme: Theme) => void
  theme: Theme
}

const initialContext: ThemeContext = {
  autoMode: true,
  setTheme: () => null,
  theme: 'light',
}

const Context = createContext(initialContext)

// TODO: get the cookie prefix from the config
const cookiesKey = 'payload-theme'

const getTheme = (): {
  theme: Theme
  themeFromCookies: null | string
} => {
  let theme: Theme
  const themeFromCookies = window.document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookiesKey}=`))
    ?.split('=')[1]

  if (themeFromCookies === 'light' || themeFromCookies === 'dark') {
    theme = themeFromCookies
  } else {
    theme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
  }

  document.documentElement.setAttribute('data-theme', theme)
  return { theme, themeFromCookies }
}

export const defaultTheme = 'light'

export const ThemeProvider: React.FC<{ children?: React.ReactNode; theme?: Theme }> = ({
  children,
  theme: initialTheme,
}) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme || defaultTheme)

  const [autoMode, setAutoMode] = useState<boolean>()

  useEffect(() => {
    const { theme, themeFromCookies } = getTheme()
    setThemeState(theme)
    setAutoMode(!themeFromCookies)
  }, [])

  const setTheme = useCallback((themeToSet: 'auto' | Theme) => {
    if (themeToSet === 'light' || themeToSet === 'dark') {
      setThemeState(themeToSet)
      setAutoMode(false)
      window.localStorage.setItem(cookiesKey, themeToSet)
      document.documentElement.setAttribute('data-theme', themeToSet)
    } else if (themeToSet === 'auto') {
      const existingThemeFromStorage = window.localStorage.getItem(cookiesKey)
      if (existingThemeFromStorage) window.localStorage.removeItem(cookiesKey)
      const themeFromOS =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
      document.documentElement.setAttribute('data-theme', themeFromOS)
      setAutoMode(true)
      setThemeState(themeFromOS)
    }
  }, [])

  return <Context.Provider value={{ autoMode, setTheme, theme }}>{children}</Context.Provider>
}

export const useTheme = (): ThemeContext => useContext(Context)
