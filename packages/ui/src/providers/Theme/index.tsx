'use client'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'

import { useConfig } from '../Config/index.js'

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

function setCookie(cname, cvalue, exdays) {
  const d = new Date()
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

const getTheme = (
  cookieKey,
): {
  theme: Theme
  themeFromCookies: null | string
} => {
  let theme: Theme

  const themeFromCookies = window.document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookieKey}=`))
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

export const ThemeProvider: React.FC<{
  children?: React.ReactNode
  theme?: Theme
}> = ({ children, theme: initialTheme }) => {
  const { config } = useConfig()

  const preselectedTheme = config.admin.theme
  const cookieKey = `${config.cookiePrefix || 'payload'}-theme`

  const [theme, setThemeState] = useState<Theme>(initialTheme || defaultTheme)

  const [autoMode, setAutoMode] = useState<boolean>()

  useEffect(() => {
    if (preselectedTheme !== 'all') {
      return
    }

    const { theme, themeFromCookies } = getTheme(cookieKey)
    setThemeState(theme)
    setAutoMode(!themeFromCookies)
  }, [preselectedTheme, cookieKey])

  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme) => {
      if (themeToSet === 'light' || themeToSet === 'dark') {
        setThemeState(themeToSet)
        setAutoMode(false)
        setCookie(cookieKey, themeToSet, 365)
        document.documentElement.setAttribute('data-theme', themeToSet)
      } else if (themeToSet === 'auto') {
        // to delete the cookie, we set an expired date
        setCookie(cookieKey, themeToSet, -1)
        const themeFromOS =
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        document.documentElement.setAttribute('data-theme', themeFromOS)
        setAutoMode(true)
        setThemeState(themeFromOS)
      }
    },
    [cookieKey],
  )

  return <Context value={{ autoMode, setTheme, theme }}>{children}</Context>
}

export const useTheme = (): ThemeContext => use(Context)
