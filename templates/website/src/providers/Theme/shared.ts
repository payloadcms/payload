import type { Theme } from './types'

export const themeStorageKey = 'payload-theme'

export const themeIsValid = (string: null | string): string is Theme => {
  return string ? ['dark', 'light'].includes(string) : false
}
