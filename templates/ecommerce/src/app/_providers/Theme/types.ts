export type Theme = 'light' | 'dark'

export interface ThemeContextType {
  theme?: Theme | null
  setTheme: (theme: Theme | null) => void // eslint-disable-line no-unused-vars
}

export function themeIsValid(string: string | null): string is Theme {
  return string ? ['light', 'dark'].includes(string) : false
}
