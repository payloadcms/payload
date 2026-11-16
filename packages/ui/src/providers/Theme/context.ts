'use client'
import type { ReactNode } from 'react'

import { createContext, use } from 'react'

import type { Theme } from './shared.js'

export type ThemeContext = {
  /** Whether the effective theme follows the system preference. Explicit nested theme overrides disable this. */
  autoMode: boolean
  highContrastMode: boolean
  /** Updates the root contrast preference, document attribute, and cookie when a root provider exists. Otherwise does nothing. */
  setHighContrastMode: (isHighContrast: boolean) => void
  /** Updates the root theme preference, document attribute, and cookie when a root provider exists. Otherwise does nothing. */
  setTheme: (theme: 'auto' | Theme) => void
  /** The resolved light or dark theme, including the nearest provider's override. */
  theme: Theme
}

export type ThemeProviderProps = {
  children?: ReactNode
  /** Controlled context value in ThemeProvider; initial preference in RootThemeProvider. Built-in contrast styling follows the root. */
  highContrastMode?: boolean
  /** Controlled context value in ThemeProvider; initial preference in RootThemeProvider. */
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

export const RootContext = createContext<ThemeContext | undefined>(undefined)

/** Returns the nearest effective theme. Setters update the explicit root provider, or do nothing without one. */
export const useTheme = (): ThemeContext => use(Context) ?? initialContext

/** Returns the explicit root preferences, or the hook defaults and no-op setters when no root provider exists. */
export const useRootTheme = (): ThemeContext => use(RootContext) ?? initialContext
