'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { themeStorageKey } from './shared'
import type { Theme } from './types'

type ThemeContextType = {
  theme: Theme | null
  setTheme: (themeToSet: Theme | null) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({
  children,
  initialTheme,
}: {
  children: React.ReactNode
  initialTheme: Theme | null
}) => {
  const [theme, setThemeState] = useState<Theme | null>(initialTheme)

  const setTheme = useCallback((themeToSet: Theme | null) => {
    if (themeToSet === null) {
      document.cookie = `${themeStorageKey}=; path=/; max-age=0`
    } else {
      document.cookie = `${themeStorageKey}=${themeToSet}; path=/; max-age=31536000; SameSite=Lax`
    }

    setThemeState(themeToSet)
    document.documentElement.dataset.theme = themeToSet ?? 'system'
  }, [])

  return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
