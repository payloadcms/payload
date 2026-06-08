'use client'
import React, { createContext, use } from 'react'

import type { Theme, ThemeContext } from '../Theme/index.js'

import { useTheme } from '../Theme/index.js'

type ScopedTheme = {
  highContrastMode: boolean
  theme: Theme
}

const Context = createContext<ScopedTheme | undefined>(undefined)

/**
 * Read-only scoped theme override for UI components like Popup and Dialog.
 * Takes a `theme` prop and inherits `highContrastMode` from the nearest global
 * ThemeProvider. Has no  mutations always go to the global ThemeProvider.setters 
 */
export const ComponentThemeProvider: React.FC<{
  children: React.ReactNode
  theme: Theme
}> = ({ children, theme }) => {
  const { highContrastMode } = useTheme()
  return <Context value={{ highContrastMode, theme }}>{children}</Context>
}

/**
 * Returns the full ThemeContext, with `theme` and `highContrastMode` overridden
 * by the nearest ComponentThemeProvider if one exists. Setters always target
 * the global ThemeProvider regardless of nesting.
 */
export const useComponentTheme = (): ThemeContext => {
  const scoped = use(Context)
  const global = useTheme()
  if (!scoped) {
    return global
  }
  return { ...global, highContrastMode: scoped.highContrastMode, theme: scoped.theme }
}
