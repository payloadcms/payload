'use client'
import type { ReactNode } from 'react'

import { createContext, use } from 'react'

import type { Theme } from './shared.js'

export type ThemeContext = {
  /** Whether the effective theme follows the system preference. Explicit nested theme overrides disable this. */
  autoMode: boolean
  highContrastMode: boolean
  /** Updates the root contrast preference, document attribute, and cookie, leaving local overrides unchanged. Does nothing without a root provider. */
  setHighContrastMode: (isHighContrast: boolean) => void
  /** Updates the root theme preference, document attribute, and cookie, leaving local overrides unchanged. Does nothing without a root provider. */
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

/**
 * Reads the nearest theme and contrast values, including local overrides.
 * Shares `setTheme` and `setHighContrastMode` with `useRootTheme`; both update RootThemeProvider's state, document attributes, and cookies.
 * Explicit local overrides remain controlled by their props.
 * Without RootThemeProvider, both callbacks do nothing.
 */
export const useTheme = (): ThemeContext => use(Context) ?? initialContext

/**
 * Reads the root preferences, regardless of local overrides.
 * Returns the same root callbacks as `useTheme`.
 * Without RootThemeProvider, returns the hook defaults and no-op callbacks.
 */
export const useRootTheme = (): ThemeContext => use(RootContext) ?? initialContext
