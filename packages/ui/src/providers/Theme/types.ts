export type Theme = 'dark' | 'light'

export type ThemeContext = {
  setTheme: (theme: Theme) => void
  theme: Theme
}
