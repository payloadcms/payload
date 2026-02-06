import type {
  DefaultTranslationKeys,
  DefaultTranslationsObject,
  I18n,
  InitI18n,
  InitTFunction,
  Language,
} from '../types.js'

import { importDateFNSLocale } from '../importDateFNSLocale.js'
import { deepMergeSimple } from './deepMergeSimple.js'
import { getTranslationsByContext } from './getTranslationsByContext.js'

/**
 * @function getTranslationString
 *
 * Gets a translation string from a translations object
 *
 * @returns string
 */
export const getTranslationString = <
  TTranslations = DefaultTranslationsObject,
  TTranslationKeys = DefaultTranslationKeys,
>({
  count,
  key,
  translations,
}: {
  count?: number
  key: TTranslationKeys
  translations: Language<TTranslations>['translations']
}): string => {
  const keys = (key as DefaultTranslationKeys).split(':')
  let keySuffix = ''

  const translation: string = keys.reduce((acc: any, key, index) => {
    if (typeof acc === 'string') {
      return acc
    }

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

  if (!translation) {
    console.log('key not found:', key)
  }

  return translation || (key as string)
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
  vars: {
    [key: string]: any
  }
}) => {
  const parts = translationString.split(/(\{\{.*?\}\})/)

  return parts
    .map((part) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const placeholder = part.substring(2, part.length - 2).trim()
        const value = vars[placeholder]
        return value !== undefined && value !== null ? value : part
      } else {
        return part
      }
    })
    .join('')
}

/**
 * @function t
 *
 * Merges config defined translations with translations passed in as an argument
 * returns a function that can be used to translate a string
 *
 * @returns string
 */
export function t<
  TTranslations = DefaultTranslationsObject,
  TTranslationKeys = DefaultTranslationKeys,
>({
  key,
  translations,
  vars,
}: {
  key: TTranslationKeys
  translations?: Language<TTranslations>['translations']
  vars?: Record<string, any>
}): string {
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
    translationString = key as string
  }

  return translationString
}

const initTFunction: InitTFunction = (args) => {
  const { config, language, translations } = args
  const mergedTranslations =
    language && config?.translations?.[language as keyof typeof config.translations]
      ? deepMergeSimple<DefaultTranslationsObject>(
          translations,
          config.translations[language as keyof typeof config.translations]!,
        )
      : translations

  return {
    t: (key, vars) => {
      return t({
        key,
        translations: mergedTranslations,
        vars,
      })
    },
    translations: mergedTranslations,
  }
}

function memoize<T extends Parameters<InitI18n>[0], K extends keyof T>(
  fn: (args: T) => Promise<I18n>,
  keys: K[],
): (args: T) => Promise<I18n> {
  const cacheMap = new Map<string, I18n>()

  const memoized = async (args: T) => {
    const cacheKey = keys.reduce((acc, key) => acc + String(args[key]), '')

    if (!cacheMap.has(cacheKey)) {
      const result = await fn(args)
      cacheMap.set(cacheKey, result)
    }

    return cacheMap.get(cacheKey)!
  }

  return memoized
}

export const initI18n = memoize(
  async ({ config, context, language = config.fallbackLanguage }) => {
    if (!language || !config.supportedLanguages?.[language]) {
      throw new Error(`Language ${language} not supported`)
    }

    const translations = getTranslationsByContext(config.supportedLanguages?.[language], context)

    const { t, translations: mergedTranslations } = initTFunction({
      config: config as any,
      language: language || config.fallbackLanguage,
      translations: translations as any,
    })

    const dateFNSKey = config.supportedLanguages[language]?.dateFNSKey || 'en-US'

    const dateFNS = await importDateFNSLocale(dateFNSKey)

    const i18n: I18n = {
      dateFNS,
      dateFNSKey,
      fallbackLanguage: config.fallbackLanguage!,
      language: language || config.fallbackLanguage,
      t,
      translations: mergedTranslations,
    }

    return i18n
  },
  ['language', 'context'] satisfies Array<keyof Parameters<InitI18n>[0]>,
)
