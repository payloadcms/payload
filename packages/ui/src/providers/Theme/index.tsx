'use client'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import canUseDOM from '../../utilities/canUseDOM'
import { Theme, ThemeContext } from './types'
import { getImplicitPreference, themeIsValid } from './utilities'

const initialContext: ThemeContext = {
  setTheme: () => null,
  theme: 'light',
}

const Context = createContext(initialContext)

export const themeLocalStorageKey = 'payload-theme'

export const defaultTheme = 'light'

export const ThemeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme | undefined>(
    canUseDOM ? (document.documentElement.getAttribute('data-theme') as Theme) : undefined,
  )

  const setTheme = useCallback((themeToSet: Theme | null) => {
    if (themeToSet === null) {
      window.localStorage.removeItem(themeLocalStorageKey)
      const implicitPreference = getImplicitPreference()
      document.documentElement.setAttribute('data-theme', implicitPreference || '')
      if (implicitPreference) setThemeState(implicitPreference)
    } else {
      setThemeState(themeToSet)
      window.localStorage.setItem(themeLocalStorageKey, themeToSet)
      document.documentElement.setAttribute('data-theme', themeToSet)
    }
  }, [])

  useEffect(() => {
    let themeToSet: Theme = defaultTheme
    const preference = window.localStorage.getItem(themeLocalStorageKey)

    if (themeIsValid(preference)) {
      themeToSet = preference
    } else {
      const implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    }

    document.documentElement.setAttribute('data-theme', themeToSet)
    setThemeState(themeToSet)
  }, [])

  return <Context.Provider value={{ setTheme, theme }}>{children}</Context.Provider>
}

export const useTheme = (): ThemeContext => useContext(Context)

export default Context
