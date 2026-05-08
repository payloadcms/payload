import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

function applyTheme(theme: Theme, isHighContrast: boolean) {
  if (theme === 'light') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
  if (isHighContrast) {
    document.documentElement.setAttribute('data-high-contrast', 'true')
  } else {
    document.documentElement.removeAttribute('data-high-contrast')
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')
  const [isHighContrast, setIsHighContrastState] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('pattern-library-theme') as null | Theme
    const savedHc = localStorage.getItem('pattern-library-hc') === 'true'

    const resolvedTheme = savedTheme === 'dark' ? 'dark' : 'light'
    setThemeState(resolvedTheme)
    setIsHighContrastState(savedHc)
    applyTheme(resolvedTheme, savedHc)
  }, [])

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next)
      localStorage.setItem('pattern-library-theme', next)
      applyTheme(next, isHighContrast)
    },
    [isHighContrast],
  )

  const toggleHighContrast = useCallback(() => {
    const next = !isHighContrast
    setIsHighContrastState(next)
    localStorage.setItem('pattern-library-hc', String(next))
    applyTheme(theme, next)
  }, [isHighContrast, theme])

  return { isHighContrast, setTheme, theme, toggleHighContrast }
}
