import type { i18n as Ii18n } from 'i18next'

export const getTranslation = (
  label: JSX.Element | Record<string, string> | string,
  i18n: Ii18n,
): string => {
  if (typeof label === 'object') {
    if (label[i18n.language]) {
      return label[i18n.language]
    }
    let fallbacks = []
    if (typeof i18n.options.fallbackLng === 'string') {
      fallbacks = [i18n.options.fallbackLng]
    } else if (Array.isArray(i18n.options.fallbackLng)) {
      fallbacks = i18n.options.fallbackLng
    } else if (typeof i18n.options.fallbackLng === 'object') {
      fallbacks = Object.keys(i18n.options.fallbackLng)
    } else if (typeof i18n.options.fallbackLng === 'function') {
      console.warn('Use of i18next fallbackLng functions are not supported.')
    }
    return label[fallbacks.find((language) => label[language])] ?? label[Object.keys(label)[0]]
  }
  return label
}
