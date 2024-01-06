import type { CustomPayloadRequest } from '../exports/types'

export const getTranslation = (
  label: JSX.Element | Record<string, string> | string,
  i18n: Pick<CustomPayloadRequest['i18n'], 'fallbackLanguage' | 'language'>,
): string => {
  if (typeof label === 'object') {
    if (label[i18n.language]) {
      return label[i18n.language]
    }

    let fallbacks = []
    if (typeof i18n.fallbackLanguage === 'string') {
      fallbacks = [i18n.fallbackLanguage]
    } else if (Array.isArray(i18n.fallbackLanguage)) {
      fallbacks = i18n.fallbackLanguage
    }

    return label[fallbacks.find((language) => label[language])] ?? label[Object.keys(label)[0]]
  }

  return label
}
