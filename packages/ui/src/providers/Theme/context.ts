'use client'
import type { ReactNode, RefObject } from 'react'

import { createContext, use } from 'react'

import type { Theme } from './shared.js'

export type ThemeContext = {
  /** Whether the root uses automatic mode. Local scopes inherit this unless they set an explicit theme. */
  autoMode: boolean
  highContrastMode: boolean
  /**
   * Sets enhanced contrast on the nearest provider's element.
   * Root changes are saved as preferences.
   */
  setHighContrastMode: (isHighContrast: boolean) => void
  /**
   * Sets light or dark on the nearest provider's element.
   * Use `useRootTheme` for automatic mode.
   */
  setTheme: (theme: Theme) => void
  /** The resolved light or dark theme, including the nearest provider's override. */
  theme: Theme
}

export type RootThemeContext = {
  /** Sets the root theme and saved preference. `'auto'` uses the system theme and clears the cookie. */
  setTheme: (theme: 'auto' | Theme) => void
} & Omit<ThemeContext, 'setTheme'>

export type ThemeProviderProps = {
  children?: ReactNode
  /**
   * Local contrast value inherited from the parent when omitted.
   * Prop changes replace local setter choices.
   */
  highContrastMode?: boolean
  /**
   * The element updated by local setters.
   * Render it inside this provider.
   * Setters throw if the ref is missing or its element isn't mounted.
   * Keep its attributes in sync with provider props because they aren't read or observed.
   */
  targetRef?: RefObject<HTMLElement | null>
  /**
   * Local theme override inherited from the parent when omitted.
   * Prop changes replace local setter choices.
   */
  theme?: Theme
}

const initialContext: RootThemeContext = {
  autoMode: true,
  highContrastMode: false,
  setHighContrastMode: () => {
    throw new Error(
      'setHighContrastMode requires RootThemeProvider. For a controlled ThemeProvider, update its highContrastMode prop instead.',
    )
  },
  setTheme: () => {
    throw new Error(
      'setTheme requires RootThemeProvider. For a controlled ThemeProvider, update its theme prop instead.',
    )
  },
  theme: 'light',
}

export const Context = createContext<ThemeContext | undefined>(undefined)

export const RootContext = createContext<RootThemeContext | undefined>(undefined)

/**
 * Reads and updates the nearest theme scope.
 * Use `useRootTheme` to escape the nearest context and access root preferences.
 * Without a provider, reads return defaults and setters throw.
 */
export const useTheme = (): ThemeContext => use(Context) ?? initialContext

/**
 * Escapes local overrides to read and update the Admin's root preferences.
 * Without `RootThemeProvider`, reads return defaults and setters throw.
 */
export const useRootTheme = (): RootThemeContext => use(RootContext) ?? initialContext
