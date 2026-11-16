'use client'
import type { ReactNode, RefObject } from 'react'

import { createContext, use } from 'react'

import type { Theme } from './shared.js'

export type ThemeContext = {
  /** Whether the theme is automatic: system preference at the root, inherited theme in a local target. */
  autoMode: boolean
  highContrastMode: boolean
  /**
   * Toggles enhanced contrast on the nearest provider's target.
   * Local providers require a mounted `targetRef`; removing the local flag does not disable inherited contrast.
   * At the Admin root, updates the document and saved preference instead.
   */
  setHighContrastMode: (isHighContrast: boolean) => void
  /**
   * Sets the nearest provider's theme.
   * Local providers require a mounted `targetRef`; `'auto'` removes its `data-theme` override and inherits the surrounding theme.
   * At the Admin root, updates the document and saved preference; `'auto'` uses the system preference.
   * Use `useRootTheme` to change root preferences from within a local provider.
   */
  setTheme: (theme: 'auto' | Theme) => void
  /** The resolved light or dark theme, including the nearest provider's override. */
  theme: Theme
}

export type ThemeProviderProps = {
  children?: ReactNode
  /** Controlled context value without `targetRef`; fallback until the target mounts otherwise. Built-in contrast styling follows the document or shadow host. */
  highContrastMode?: boolean
  /**
   * The local element whose theme attributes this provider reads and writes.
   * Render it inside this provider; no wrapper element is added automatically.
   * Mount them together, or rerender the provider when a deferred target mounts.
   * Its attributes become the source of truth once mounted.
   * Without a mounted target, local setters throw; controlled props remain readable.
   */
  targetRef?: RefObject<HTMLElement | null>
  /** Controlled context value without `targetRef`; fallback until the target mounts otherwise. */
  theme?: Theme
}

const initialContext: ThemeContext = {
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

export const RootContext = createContext<ThemeContext | undefined>(undefined)

/**
 * Reads the nearest theme and contrast values, including local overrides.
 * Inside ThemeProvider, setters affect only its `targetRef` and throw if no mounted target is supplied.
 * Without a local provider, the Admin root supplies setters that update document attributes and cookies.
 * Reading without either provider returns defaults; calling those fallback setters throws.
 */
export const useTheme = (): ThemeContext => use(Context) ?? initialContext

/**
 * Reads the root preferences, regardless of local overrides.
 * Its setters always update root preferences, document attributes, and cookies, including from inside a local provider.
 * Without RootThemeProvider, returns the hook defaults; calling either callback throws.
 */
export const useRootTheme = (): ThemeContext => use(RootContext) ?? initialContext
