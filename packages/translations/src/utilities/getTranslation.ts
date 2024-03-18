import type { JSX } from 'react'

import type { I18n } from '../types.js'

type LabelType = JSX.Element | Record<string, string> | string

export const getTranslation = <T extends LabelType>(
  label: T,
  i18n: Pick<I18n, 'fallbackLanguage' | 'language'>,
): T extends JSX.Element ? JSX.Element : string => {
  // If it's a Record, look for translation. If string or React Element, pass through
  if (typeof label === 'object' && !Object.prototype.hasOwnProperty.call(label, '$$typeof')) {
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

  // If it's a React Element or string, then we should just pass it through
  return label as unknown as T extends JSX.Element ? JSX.Element : string
}
