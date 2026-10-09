import type { Language } from '../types.js'

import { clientTranslationKeys } from '../clientKeys.js'

/**
 * The client translation keys, grouped by namespace. For example, the keys `general:cancel`,
 * `general:item` and `authentication:account` are stored as:
 *
 * `Map { 'general' => Set { 'cancel', 'item' }, 'authentication' => Set { 'account' } }`
 */
const clientKeysByNamespace = new Map<string, Set<string>>()
for (const clientKey of clientTranslationKeys) {
  const separatorIndex = clientKey.indexOf(':')
  const namespace = clientKey.slice(0, separatorIndex)
  const key = clientKey.slice(separatorIndex + 1)
  const keys = clientKeysByNamespace.get(namespace) ?? new Set<string>()
  clientKeysByNamespace.set(namespace, keys.add(key))
}

/** Plural forms of a key, for example `item_one` and `item_other` for `item` */
const pluralSuffix = /_(?:zero|one|two|few|many|other)$/

/**
 * Keeps only the translations the admin needs in the browser: the keys listed in
 * `clientTranslationKeys`, plus their plural forms. Namespaces that end up empty are left out.
 *
 * @example
 * // With the client keys `general:cancel` and `general:item`:
 * filterClientKeys({
 *   general: { cancel: 'Cancel', item: 'Item', item_other: 'Items', save: 'Save' },
 *   error: { notFound: 'Not found' },
 * })
 * // => { general: { cancel: 'Cancel', item: 'Item', item_other: 'Items' } }
 */
function filterClientKeys(translations: Record<string, unknown>) {
  const result: Record<string, unknown> = {}

  for (const [namespace, value] of Object.entries(translations)) {
    if (namespace === '$schema') {
      result[namespace] = value
      continue
    }

    const clientKeys = clientKeysByNamespace.get(namespace)
    if (!clientKeys || typeof value !== 'object' || value === null) {
      continue
    }

    const clientTranslations: Record<string, unknown> = {}
    for (const [key, translation] of Object.entries(value)) {
      if (clientKeys.has(key) || clientKeys.has(key.replace(pluralSuffix, ''))) {
        clientTranslations[key] = translation
      }
    }

    if (Object.keys(clientTranslations).length > 0) {
      result[namespace] = clientTranslations
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
    return sortObject(filterClientKeys(selectedLanguage.translations))
  } else {
    return selectedLanguage.translations
  }
}
