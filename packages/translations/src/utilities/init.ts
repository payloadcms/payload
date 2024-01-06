import type { PayloadRequest, SanitizedConfig } from 'payload/types'

import { Translations } from '../types'
import { deepMerge } from './deepMerge'

/**
 * @function getTranslationString
 *
 * Gets a translation string from a translations object
 *
 * @returns string
 */
export const getTranslationString = ({
  count,
  key,
  translations,
}: {
  count?: number
  key: string
  translations: SanitizedConfig['i18n']['translations'][0]
}) => {
  const keys = key.split(':')
  let keySuffix = ''

  const translation: string = keys.reduce((acc: any, key, index) => {
    if (typeof acc === 'string') return acc

    if (typeof count === 'number') {
      if (count === 0 && `${key}_zero` in acc) {
        keySuffix = '_zero'
      } else if (count === 1 && `${key}_one` in acc) {
        keySuffix = '_one'
      } else if (count === 2 && `${key}_two` in acc) {
        keySuffix = '_two'
      } else if (count > 5 && `${key}_many` in acc) {
        keySuffix = '_many'
      } else if (count > 2 && count <= 5 && `${key}_few` in acc) {
        keySuffix = '_few'
      } else if (`${key}_other` in acc) {
        keySuffix = '_other'
      }
    }
    let keyToUse = key
    if (index === keys.length - 1 && keySuffix) {
      keyToUse = `${key}${keySuffix}`
    }

    if (acc && keyToUse in acc) {
      return acc[keyToUse]
    }

    return undefined
  }, translations)

  return translation
}

/**
 * @function replaceVars
 *
 * Replaces variables in a translation string with values from an object
 *
 * @returns string
 */
const replaceVars = ({
  translationString,
  vars,
}: {
  translationString: string
  vars: Record<string, string>
}) => {
  return Object.keys(vars).reduce((acc, varKey) => {
    if (acc) {
      return acc.replace(`{{${varKey}}}`, vars[varKey])
    }
    return acc
  }, translationString)
}

/**
 * @function t
 *
 * Merges config defined translations with translations passed in as an argument
 * returns a function that can be used to translate a string
 *
 * @returns string
 */
type TFunctionConstructor = ({
  key,
  translations,
  vars,
}: {
  key: string
  translations?: Translations[0]
  vars?: Record<string, any>
}) => string

export const t: TFunctionConstructor = ({ key, translations, vars }) => {
  let translationString = getTranslationString({
    count: typeof vars?.count === 'number' ? vars.count : undefined,
    key,
    translations,
  })

  if (vars) {
    translationString = replaceVars({
      translationString,
      vars,
    })
  }

  if (!translationString) {
    translationString = key
  }

  return translationString
}

type LanguagePreference = {
  language: string
  quality?: number
}

function parseAcceptLanguage(header: string): LanguagePreference[] {
  return header
    .split(',')
    .map((lang) => {
      const [language, quality] = lang.trim().split(';q=')
      return {
        language,
        quality: quality ? parseFloat(quality) : 1,
      }
    })
    .sort((a, b) => b.quality - a.quality) // Sort by quality, highest to lowest
}

const acceptedLanguages = [
  'ar',
  'az',
  'bg',
  'cs',
  'de',
  'en',
  'es',
  'fa',
  'fr',
  'hr',
  'hu',
  'it',
  'ja',
  'ko',
  'my',
  'nb',
  'nl',
  'pl',
  'pt',
  'ro',
  'rs',
  'rsLatin',
  'ru',
  'sv',
  'th',
  'tr',
  'ua',
  'vi',
  'zh',
  'zhTw',
]

export function matchLanguage(header: string): string | undefined {
  const parsedHeader = parseAcceptLanguage(header)

  for (const acceptedLanguage of acceptedLanguages) {
    for (const { language } of parsedHeader) {
      if (language.startsWith(acceptedLanguage)) {
        return acceptedLanguage
      }
    }
  }

  return undefined
}

export type TFunction = (key: string, options?: Record<string, any>) => string
type initI18nArgs = {
  config: SanitizedConfig
  language?: string
  translations?: Translations
}
export const initTFunction =
  (args: initI18nArgs): TFunction =>
  (key, vars) => {
    const { config, language, translations } = args

    const mergedLanguages = deepMerge(config.i18n?.translations ?? {}, translations)
    const languagePreference = matchLanguage(language)

    return t({
      key,
      translations: mergedLanguages[languagePreference],
      vars,
    })
  }

export const initI18n = ({
  config,
  language = 'en',
  translations,
}: initI18nArgs): PayloadRequest['i18n'] => {
  return {
    fallbackLanguage: config.i18n.fallbackLanguage,
    language: language || config.i18n.fallbackLanguage,
    t: initTFunction({
      config,
      language: language || config.i18n.fallbackLanguage,
      translations,
    }),
  }
}
