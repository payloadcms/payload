'use client'
import type { ReactNode } from 'react'

import { createContext, use } from 'react'

import type { Theme } from './shared.js'

export type ThemeContext = {
  autoMode: boolean
  highContrastMode: boolean
  setHighContrastMode: (isHighContrast: boolean) => void
  setTheme: (theme: 'auto' | Theme) => void
  theme: Theme
}

export type ThemeProviderProps = {
  children?: ReactNode
  highContrastMode?: boolean
  theme?: Theme
}

const initialContext: ThemeContext = {
  autoMode: true,
  highContrastMode: false,
  setHighContrastMode: () => null,
  setTheme: () => null,
  theme: 'light',
}

export const Context = createContext<ThemeContext | undefined>(undefined)

export const useTheme = (): ThemeContext => use(Context) ?? initialContext
