'use client'
import React, { use } from 'react'

import type { ThemeProviderProps } from './context.js'

import { Context } from './context.js'
import { RootThemeProvider } from './RootThemeProvider/index.js'

export type { ThemeContext } from './context.js'
export { useRootTheme, useTheme } from './context.js'
export { defaultTheme, type Theme } from './shared.js'

/**
 * Provides theme context to its children.
 *
 * At the root (no parent ThemeProvider): renders `RootThemeProvider`, which reads/writes cookies, detects OS preferences, and owns `setTheme` and `setHighContrastMode`.
 *
 * When nested inside another ThemeProvider (e.g. inside a Popup): acts as a scoped context override.
 * The `theme` and `highContrastMode` props set local context values; omitted values inherit from the parent.
 * `useTheme` reads this local context, while `useRootTheme` reads the root preferences.
 * `setTheme` and `setHighContrastMode` are shared directly with the root provider, so mutations always affect the global user preference.
 * Nested providers do not own preference state or write cookies or DOM attributes.
 * `Popup` sets its own `data-theme` attribute for its visual override.
 *
 * The root provider also reads the `?theme=light|dark|auto` query parameter and persists it to the theme cookie using the same mechanism as manual theme selection, when `admin.theme` is `all`.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  highContrastMode,
  theme,
}) => {
  const parentContext = use(Context)

  if (parentContext === undefined) {
    return (
      <RootThemeProvider highContrastMode={highContrastMode} theme={theme}>
        {children}
      </RootThemeProvider>
    )
  }

  if (theme === undefined && highContrastMode === undefined) {
    return children
  }

  return (
    <Context
      value={{
        autoMode: theme === undefined ? parentContext.autoMode : false,
        highContrastMode: highContrastMode ?? parentContext.highContrastMode,
        setHighContrastMode: parentContext.setHighContrastMode,
        setTheme: parentContext.setTheme,
        theme: theme ?? parentContext.theme,
      }}
    >
      {children}
    </Context>
  )
}
