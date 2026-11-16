'use client'
import React from 'react'

import type { ThemeProviderProps } from './context.js'

import { Context, useTheme } from './context.js'

export type { ThemeContext } from './context.js'
export { useRootTheme, useTheme } from './context.js'
export { defaultTheme, type Theme } from './shared.js'

/**
 * Provides theme context to its children.
 *
 * At the root (no parent ThemeProvider): provides the supplied theme and contrast values, falling back to the hook defaults when omitted.
 * It does not read cookies, detect system preferences, or change DOM attributes.
 *
 * When nested inside another ThemeProvider (e.g. inside a Popup): acts as a scoped context override.
 * The `theme` and `highContrastMode` props set local context values; omitted values inherit from the parent.
 * `useTheme` reads this local context, while `useRootTheme` reads the root preferences.
 * `Popup` sets its own `data-theme` attribute for its visual override.
 *
 * The Admin explicitly mounts `RootThemeProvider` to manage preferences, cookies, system detection, and document attributes.
 * Its `setTheme` and `setHighContrastMode` functions are shared with descendants, so calls update the root preference.
 * Calling either setter without an explicit root provider throws.
 * Update the provider props to change a standalone or local override.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  highContrastMode,
  theme,
}) => {
  const parentContext = useTheme()

  const value =
    theme === undefined && highContrastMode === undefined
      ? parentContext
      : {
          autoMode: theme === undefined ? parentContext.autoMode : false,
          highContrastMode: highContrastMode ?? parentContext.highContrastMode,
          setHighContrastMode: parentContext.setHighContrastMode,
          setTheme: parentContext.setTheme,
          theme: theme ?? parentContext.theme,
        }

  // Keep the provider mounted as overrides change so descendants retain state and focus.
  return <Context value={value}>{children}</Context>
}
