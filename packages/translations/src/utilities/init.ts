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
 * Payload language codes that are not valid BCP 47 tags. Without this mapping,
 * `Intl.PluralRules` would not recognize them and the fixed count thresholds would be used.
 */
export const pluralRulesLocaleByLanguage: Record<string, string> = {
  rs: 'sr',
  'rs-latin': 'sr-Latn',
}

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
  language,
  translations,
}: {
  count?: number
  key: TTranslationKeys
  /**
   * The language of `translations`. When set, plural forms are chosen by the CLDR rules
   * of that language. Without it, fixed count thresholds are used.
   */
  language?: string
  translations: Language<TTranslations>['translations']
}): string => {
  const keys = (key as DefaultTranslationKeys).split(':')

  const translation: string = keys.reduce((acc: any, key, index) => {
    if (typeof acc === 'string') {
      return acc
    }

    if (!acc) {
      return undefined
    }

    let keyToUse = key
    if (index === keys.length - 1 && typeof count === 'number') {
      keyToUse = `${key}${getPluralSuffix({ count, key, language, translations: acc })}`
    }

    if (keyToUse in acc) {
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
  language,
  translations,
  vars,
}: {
  key: TTranslationKeys
  /**
   * The language of `translations`. When set, plural forms are chosen by the CLDR rules
   * of that language. Without it, fixed count thresholds are used.
   */
  language?: string
  translations?: Language<TTranslations>['translations']
  vars?: Record<string, any>
}): string {
  let translationString = getTranslationString({
    count: typeof vars?.count === 'number' ? vars.count : undefined,
    key,
    language,
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
        language,
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

/**
 * `Intl.PluralRules` per language. Construction is much slower than `select`, and `t` runs
 * on every render. `undefined` means `Intl` has no plural rules for the language.
 */
const pluralRulesCache = new Map<string, Intl.PluralRules | undefined>()

/**
 * Returns the suffix of the plural form to use for `key`, for example `_one`,
 * or an empty string when `key` has no matching plural form.
 */
const getPluralSuffix = ({
  count,
  key,
  language,
  translations,
}: {
  count: number
  key: string
  language?: string
  translations: Record<string, unknown>
}): string => {
  if (count === 0 && `${key}_zero` in translations) {
    return '_zero'
  }

  const pluralRules = language ? getPluralRules({ language }) : undefined

  if (pluralRules) {
    const category = pluralRules.select(count)

    // `_zero` means "nothing" and is handled above. The CLDR category "zero" is a grammatical
    // form that also covers other numbers, e.g. 10 and 11-19 in Latvian.
    if (category !== 'zero' && `${key}_${category}` in translations) {
      return `_${category}`
    }

    return `${key}_other` in translations ? '_other' : ''
  }

  if (count === 1 && `${key}_one` in translations) {
    return '_one'
  } else if (count === 2 && `${key}_two` in translations) {
    return '_two'
  } else if (count > 5 && `${key}_many` in translations) {
    return '_many'
  } else if (count > 2 && count <= 5 && `${key}_few` in translations) {
    return '_few'
  } else if (`${key}_other` in translations) {
    return '_other'
  }

  return ''
}

/**
 * Returns the cached plural rules of `language`, or `undefined` when `Intl` does not support it.
 * That covers invalid tags, which throw, and well-formed tags that `Intl` does not know, e.g. a
 * custom language `xx` or any language on a runtime without full ICU data. `new Intl.PluralRules`
 * does not throw for those and silently applies the rules of the default locale instead.
 */
const getPluralRules = ({ language }: { language: string }): Intl.PluralRules | undefined => {
  if (!pluralRulesCache.has(language)) {
    const locale = pluralRulesLocaleByLanguage[language] ?? language
    let pluralRules: Intl.PluralRules | undefined

    try {
      pluralRules =
        Intl.PluralRules.supportedLocalesOf(locale).length > 0
          ? new Intl.PluralRules(locale)
          : undefined
    } catch {
      pluralRules = undefined
    }

    pluralRulesCache.set(language, pluralRules)
  }

  return pluralRulesCache.get(language)
}
