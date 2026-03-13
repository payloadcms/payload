'use client'

import { createContext, useContext, useState } from 'react'
import type { Theme } from './Theme/types'

type HeaderThemeContextType = {
  headerTheme: Theme | null
  setHeaderTheme: React.Dispatch<React.SetStateAction<Theme | null>>
}

const HeaderThemeContext = createContext<HeaderThemeContextType | undefined>(undefined)

export const HeaderThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [headerTheme, setHeaderTheme] = useState<Theme | null>(null)

  return (
    <HeaderThemeContext.Provider value={{ headerTheme, setHeaderTheme }}>
      {children}
    </HeaderThemeContext.Provider>
  )
}

export const useHeaderTheme = () => {
  const ctx = useContext(HeaderThemeContext)
  if (!ctx) throw new Error('useHeaderTheme must be used within HeaderThemeProvider')
  return ctx
}
