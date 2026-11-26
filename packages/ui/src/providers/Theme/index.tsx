'use client'

export type { RootThemeContext, ThemeContext } from './context.js'
export { useRootTheme, useTheme } from './context.js'
export { defaultTheme, type Theme } from './shared.js'
export { ThemeProvider } from './ThemeProvider/index.js'
export { getHighContrastModeFromSystem, getThemeFromSystem } from './utilities.js'
