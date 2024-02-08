import type { JSX } from 'react'
import { I18n } from '../types'

export const getTranslation = (
  label: JSX.Element | Record<string, string> | string,
  i18n: Pick<I18n, 'fallbackLanguage' | 'language'>,
): string => {
  if (typeof label === 'object') {
    if (label[i18n.language]) {
      return label[i18n.language]
    }

    let fallbacks: string[] = []
    if (typeof i18n.fallbackLanguage === 'string') {
      fallbacks = [i18n.fallbackLanguage]
    } else if (Array.isArray(i18n.fallbackLanguage)) {
      fallbacks = i18n.fallbackLanguage
    }

    const fallbackLang = fallbacks.find((language) => label[language])
    return fallbackLang && label[fallbackLang] ? fallbackLang : label[Object.keys(label)[0]]
  }

  return label
}
