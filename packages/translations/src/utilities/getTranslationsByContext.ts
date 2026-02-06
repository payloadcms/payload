import type { Language } from '../types.js'

import { clientTranslationKeys } from '../clientKeys.js'

function filterKeys(obj: Record<string, unknown>, parentGroupKey = '', keys: string[]) {
  const result: Record<string, unknown> = {}

  for (const [namespaceKey, value] of Object.entries(obj)) {
    // Skip $schema key
    if (namespaceKey === '$schema') {
      result[namespaceKey] = value
      continue
    }

    if (typeof value === 'object') {
      const filteredObject = filterKeys(value as Record<string, unknown>, namespaceKey, keys)
      if (Object.keys(filteredObject).length > 0) {
        result[namespaceKey] = filteredObject
      }
    } else {
      for (const key of keys) {
        const [groupKey, selector] = key.split(':')

        if (parentGroupKey === groupKey) {
          if (namespaceKey === selector) {
            result[selector] = value
          } else {
            const pluralKeys = ['zero', 'one', 'two', 'few', 'many', 'other']
            pluralKeys.forEach((pluralKey) => {
              if (namespaceKey === `${selector}_${pluralKey}`) {
                result[`${selector}_${pluralKey}`] = value
              }
            })
          }
        }
      }
    }
  }

  return result
}

function sortObject(obj: Record<string, unknown>) {
  const sortedObject: Record<string, unknown> = {}
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      if (typeof obj[key] === 'object') {
        sortedObject[key] = sortObject(obj[key] as Record<string, unknown>)
      } else {
        sortedObject[key] = obj[key]
      }
    })
  return sortedObject
}

export const getTranslationsByContext = (selectedLanguage: Language, context: 'api' | 'client') => {
  if (context === 'client') {
    return sortObject(filterKeys(selectedLanguage.translations, '', clientTranslationKeys))
  } else {
    return selectedLanguage.translations
  }
}
