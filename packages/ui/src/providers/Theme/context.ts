'use client'
import type { ReactNode } from 'react'

import { createContext, use } from 'react'

import type { Theme } from './shared.js'

export type ThemeContext = {
  /** Whether the effective theme follows the system preference. Explicit nested theme overrides disable this. */
  autoMode: boolean
  highContrastMode: boolean
  /** Updates the root contrast preference, document attribute, and cookie. Nested overrides remain unchanged. */
  setHighContrastMode: (isHighContrast: boolean) => void
  /** Updates the root theme preference, document attribute, and cookie. Nested overrides remain unchanged. */
  setTheme: (theme: 'auto' | Theme) => void
  /** The resolved light or dark theme, including the nearest provider's override. */
  theme: Theme
}

export type ThemeProviderProps = {
  children?: ReactNode
  /** Initial root contrast mode, or a controlled context override when nested. Built-in contrast styling follows the root. */
  highContrastMode?: boolean
  /** Initial root theme, or a controlled override of the inherited theme when nested. */
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

/** Returns the nearest effective theme. Setters always update the root preferences. */
export const useTheme = (): ThemeContext => use(Context) ?? initialContext

/** Returns the root preferences, even inside a nested theme override. */
export const useRootTheme = (): ThemeContext => use(RootContext) ?? initialContext
