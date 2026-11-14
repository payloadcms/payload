'use client'
import React, { use } from 'react'

import type { ThemeProviderProps } from './context.js'

import { Context } from './context.js'
import { RootThemeProvider } from './RootThemeProvider/index.js'

export type { ThemeContext } from './context.js'
export { useTheme } from './context.js'
export { defaultTheme, type Theme } from './shared.js'

/**
 * Provides theme preferences at the root and inherits an existing theme context when nested.
 * Nested providers ignore initial theme and contrast props; visual overrides belong on the surrounding element.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  highContrastMode,
  theme,
}) => {
  const parentContext = use(Context)

  if (parentContext !== undefined) {
    return children
  }

  return (
    <RootThemeProvider highContrastMode={highContrastMode} theme={theme}>
      {children}
    </RootThemeProvider>
  )
}
