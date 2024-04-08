import type { Translations } from '../types.js'

import { clientTranslationKeys } from '../clientKeys.js'

function filterKeys(obj, parentGroupKey = '', keys) {
  const result = {}

  for (const [namespaceKey, value] of Object.entries(obj)) {
    // Skip $schema key
    if (namespaceKey === '$schema') {
      result[namespaceKey] = value
      continue
    }

    if (typeof value === 'object') {
      const filteredObject = filterKeys(value, namespaceKey, keys)
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

function sortObject(obj) {
  const sortedObject = {}
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      if (typeof obj[key] === 'object') {
        sortedObject[key] = sortObject(obj[key])
      } else {
        sortedObject[key] = obj[key]
      }
    })
  return sortedObject
}

export const dynamicallyImportLanguages = async (
  supportedLanguages: string[],
  context: 'api' | 'client',
) => {
  const languages: Translations = {}

  await Promise.all(
    supportedLanguages.map(async (supportedLanguage) => {
      let imported
      switch (supportedLanguage) {
        case 'ar':
          imported = await import(`@payloadcms/translations/languages/ar`)
          break
        case 'az':
          imported = await import(`@payloadcms/translations/languages/az`)
          break
        case 'bg':
          imported = await import(`@payloadcms/translations/languages/bg`)
          break
        case 'cs':
          imported = await import(`@payloadcms/translations/languages/cs`)
          break
        case 'de':
          imported = await import(`@payloadcms/translations/languages/de`)
          break
        case 'en':
          imported = await import(`@payloadcms/translations/languages/en`)
          break
        case 'es':
          imported = await import(`@payloadcms/translations/languages/es`)
          break
        case 'fa':
          imported = await import(`@payloadcms/translations/languages/fa`)
          break
        case 'fr':
          imported = await import(`@payloadcms/translations/languages/fr`)
          break
        case 'hr':
          imported = await import(`@payloadcms/translations/languages/hr`)
          break
        case 'hu':
          imported = await import(`@payloadcms/translations/languages/hu`)
          break
        case 'it':
          imported = await import(`@payloadcms/translations/languages/it`)
          break
        case 'ja':
          imported = await import(`@payloadcms/translations/languages/ja`)
          break
        case 'ko':
          imported = await import(`@payloadcms/translations/languages/ko`)
          break
        case 'my':
          imported = await import(`@payloadcms/translations/languages/my`)
          break
        case 'nb':
          imported = await import(`@payloadcms/translations/languages/nb`)
          break
        case 'nl':
          imported = await import(`@payloadcms/translations/languages/nl`)
          break
        case 'pl':
          imported = await import(`@payloadcms/translations/languages/pl`)
          break
        case 'pt':
          imported = await import(`@payloadcms/translations/languages/pt`)
          break
        case 'ro':
          imported = await import(`@payloadcms/translations/languages/ro`)
          break
        case 'rs':
          imported = await import(`@payloadcms/translations/languages/rs`)
          break
        case 'rsLatin':
          imported = await import(`@payloadcms/translations/languages/rsLatin`)
          break
        case 'ru':
          imported = await import(`@payloadcms/translations/languages/ru`)
          break
        case 'sv':
          imported = await import(`@payloadcms/translations/languages/sv`)
          break
        case 'th':
          imported = await import(`@payloadcms/translations/languages/th`)
          break
        case 'tr':
          imported = await import(`@payloadcms/translations/languages/tr`)
          break
        case 'ua':
          imported = await import(`@payloadcms/translations/languages/ua`)
          break
        case 'vi':
          imported = await import(`@payloadcms/translations/languages/vi`)
          break
        case 'zh':
          imported = await import(`@payloadcms/translations/languages/zh`)
          break
        case 'zhTw':
          imported = await import(`@payloadcms/translations/languages/zhTw`)
          break
      }

      if (imported) {
        if (context === 'client') {
          const clientTranslations = sortObject(
            filterKeys(imported.default, '', clientTranslationKeys),
          )

          languages[supportedLanguage] = clientTranslations
        } else {
          languages[supportedLanguage] = imported.default
        }
      }
    }),
  )

  return languages
}
