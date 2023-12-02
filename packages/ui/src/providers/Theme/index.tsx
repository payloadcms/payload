import React, { createContext, useCallback, useContext, useState } from 'react'

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

const localStorageKey = 'payload-theme'

const getTheme = () => {
  let theme: Theme
  const themeFromStorage = window.localStorage.getItem(localStorageKey)

  if (themeFromStorage === 'light' || themeFromStorage === 'dark') {
    theme = themeFromStorage
  } else {
    theme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
  }

  document.documentElement.setAttribute('data-theme', theme)
  return theme
}

export const ThemeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [autoMode, setAutoMode] = useState(() => {
    const themeFromStorage = window.localStorage.getItem(localStorageKey)
    return !themeFromStorage
  })

  const setTheme = useCallback((themeToSet: 'auto' | Theme) => {
    if (themeToSet === 'light' || themeToSet === 'dark') {
      setThemeState(themeToSet)
      setAutoMode(false)
      window.localStorage.setItem(localStorageKey, themeToSet)
      document.documentElement.setAttribute('data-theme', themeToSet)
    } else if (themeToSet === 'auto') {
      const existingThemeFromStorage = window.localStorage.getItem(localStorageKey)
      if (existingThemeFromStorage) window.localStorage.removeItem(localStorageKey)
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

export default Context
