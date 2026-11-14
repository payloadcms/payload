'use client'
import React, { use } from 'react'

import type { ThemeProviderProps } from './context.js'

import { Context } from './context.js'
import { RootThemeProvider } from './RootThemeProvider/index.js'

export type { ThemeContext } from './context.js'
export { useRootTheme, useTheme } from './context.js'
export { defaultTheme, type Theme } from './shared.js'

/**
 * Provides root theme preferences or stateless overrides of the nearest theme context.
 * Nested providers share the root setters and leave DOM attributes and cookies unchanged.
 * Apply `data-theme` to the surrounding element for local theme styling.
 * Built-in enhanced contrast styling follows the document or shadow host, regardless of nested context overrides.
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
