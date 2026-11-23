import type { DefaultTranslationsObject, I18n, InitI18n, InitTFunction } from '../types.js'

import { importDateFNSLocale } from '../importDateFNSLocale.js'
import { deepMergeSimple } from './deepMergeSimple.js'
import { getTranslationsByContext } from './getTranslationsByContext.js'
import { t } from './t.js'

export { getTranslationString, t } from './t.js'

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
