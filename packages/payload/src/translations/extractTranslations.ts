import { translations } from '@payloadcms/translations/api'

export const extractTranslations = (keys: string[]): Record<string, Record<string, string>> => {
  const result = {}
  keys.forEach((key) => {
    result[key] = {}
  })
  Object.entries(translations).forEach(([language, resource]) => {
    keys.forEach((key) => {
      const [section, target] = key.split(':')
      if (resource?.[section]?.[target]) {
        result[key][language] = resource[section][target]
      } else {
        console.error(`Missing translation for ${key} in ${language}`)
      }
    })
  })
  return result
}
