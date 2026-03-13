import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { Theme } from './Theme/types'

export const Providers: React.FC<{
  initialTheme: Theme | null
  children: React.ReactNode
}> = ({ initialTheme, children }) => {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <HeaderThemeProvider>{children}</HeaderThemeProvider>
    </ThemeProvider>
  )
}
