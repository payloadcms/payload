'use client'
import type { ReactNode, RefObject } from 'react'

import { createContext, use } from 'react'

import type { Theme } from './shared.js'

export type ThemeContext = {
  /** Whether the root uses automatic mode. Local scopes inherit this unless they set an explicit theme. */
  autoMode: boolean
  highContrastMode: boolean
  /**
   * Toggles enhanced contrast on the nearest provider's target.
   * Local providers require a mounted `targetRef`; removing the local flag does not disable inherited contrast styling.
   * At the Admin root, updates the document and saved preference instead.
   */
  setHighContrastMode: (isHighContrast: boolean) => void
  /**
   * Sets light or dark on the nearest scope. Local providers require a mounted `targetRef`.
   * Use `useRootTheme` to change root preferences, including automatic mode.
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
  /** Local contrast value; omitted values inherit from the parent. Later prop changes replace local setter choices. */
  highContrastMode?: boolean
  /**
   * The local element whose attributes the setters update.
   * Render it inside this provider; no wrapper element is added automatically.
   * Attributes are not read or observed; keep them in sync when changing provider props.
   * Without a mounted target, local setters throw; context remains readable.
   */
  targetRef?: RefObject<HTMLElement | null>
  /** Local theme override; omitted values inherit from the parent. Later prop changes replace local setter choices. */
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
 * Reads the nearest theme and contrast values, including local overrides.
 * Inside ThemeProvider, setters affect only its `targetRef` and throw if no mounted target is supplied.
 * Without a local provider, the Admin root supplies setters that update document attributes and cookies.
 * Its theme setter accepts light or dark; use `useRootTheme` for automatic mode.
 * Reading without either provider returns defaults; calling those fallback setters throws.
 */
export const useTheme = (): ThemeContext => use(Context) ?? initialContext

/**
 * Reads the root preferences, regardless of local overrides.
 * Its setters always update root preferences, document attributes, and cookies, including from inside a local provider.
 * Without RootThemeProvider, returns the hook defaults; calling either callback throws.
 */
export const useRootTheme = (): RootThemeContext => use(RootContext) ?? initialContext
