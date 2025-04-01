import type { JSX } from 'react'

import type { I18n, I18nClient, TFunction } from '../types.js'

type LabelType =
  | (() => JSX.Element)
  | ((args: { i18n: I18nClient; t: TFunction }) => string)
  | JSX.Element
  | Record<string, string>
  | string

export const getTranslation = <T extends LabelType>(
  label: T,
  i18n: Pick<I18n<any, any>, 'fallbackLanguage' | 'language' | 't'>,
): T extends JSX.Element ? JSX.Element : string => {
  // If it's a Record, look for translation. If string or React Element, pass through
  if (typeof label === 'object' && !Object.prototype.hasOwnProperty.call(label, '$$typeof')) {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    if (label[i18n.language]) {
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      return label[i18n.language]
    }

    let fallbacks: string[] = []
    if (typeof i18n.fallbackLanguage === 'string') {
      fallbacks = [i18n.fallbackLanguage]
    } else if (Array.isArray(i18n.fallbackLanguage)) {
      fallbacks = i18n.fallbackLanguage
    }

    const fallbackLang = fallbacks.find((language) => label[language as keyof typeof label])

    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return fallbackLang && label[fallbackLang] ? label[fallbackLang] : label[Object.keys(label)[0]]
  }

  if (typeof label === 'function') {
    return label({ i18n: undefined as any, t: i18n.t }) as unknown as T extends JSX.Element
      ? JSX.Element
      : string
  }

  // If it's a React Element or string, then we should just pass it through
  return label as unknown as T extends JSX.Element ? JSX.Element : string
}
