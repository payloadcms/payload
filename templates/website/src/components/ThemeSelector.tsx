'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useTheme } from '@/providers/Theme'
import type { Theme } from '@/providers/Theme/types'

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme()

  const value: Theme | 'auto' = theme ?? 'auto'

  const onThemeChange = (themeToSet: Theme | 'auto') => {
    setTheme(themeToSet === 'auto' ? null : themeToSet)
  }

  return (
    <Select value={value} onValueChange={(v) => onThemeChange(v as Theme | 'auto')}>
      <SelectTrigger className="w-35">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="auto">Auto</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  )
}
