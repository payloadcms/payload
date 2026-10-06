import { rtlLanguages } from '@payloadcms/translations'

export type Direction = 'ltr' | 'rtl'

/**
 * Resolves the `<html dir>` value for a language code. Returns lowercase
 * `'ltr'`/`'rtl'` to match the `[dir='ltr']`/`[dir='rtl']` selectors the admin
 * stylesheet scopes its layout rules under (e.g. the document sidebar divider).
 * Single source of truth shared across framework adapters so the SSR'd `dir`
 * never diverges from what the CSS expects.
 */
export const getLanguageDir = ({ languageCode }: { languageCode: string }): Direction =>
  (rtlLanguages as readonly string[]).includes(languageCode) ? 'rtl' : 'ltr'
