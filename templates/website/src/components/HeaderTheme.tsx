'use client'

import { useEffect } from 'react'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import type { Theme } from '@/providers/Theme/types'

interface HeaderThemeProps {
  theme?: Theme | null
}

export const HeaderTheme: React.FC<HeaderThemeProps> = ({ theme = null }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme((prev) => (prev === theme ? prev : theme))
    return () => setHeaderTheme(null)
  }, [setHeaderTheme, theme])

  return null
}
