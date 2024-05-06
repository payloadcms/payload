import type { AcceptedLanguages } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import merge from 'deepmerge'

import type {
  Config,
  LocalizationConfigWithLabels,
  LocalizationConfigWithNoLabels,
  SanitizedConfig,
} from './types.js'

import { defaultUserCollection } from '../auth/defaultUser.js'
import { sanitizeCollection } from '../collections/config/sanitize.js'
import { migrationsCollection } from '../database/migrations/migrationsCollection.js'
import { InvalidConfiguration } from '../errors/index.js'
import { sanitizeGlobals } from '../globals/config/sanitize.js'
import getPreferencesCollection from '../preferences/preferencesCollection.js'
import checkDuplicateCollections from '../utilities/checkDuplicateCollections.js'
import { isPlainObject } from '../utilities/isPlainObject.js'
import { defaults } from './defaults.js'

const sanitizeAdminConfig = (configToSanitize: Config): Partial<SanitizedConfig> => {
  const sanitizedConfig = { ...configToSanitize }

  // add default user collection if none provided
  if (!sanitizedConfig?.admin?.user) {
    const firstCollectionWithAuth = sanitizedConfig.collections.find(({ auth }) => Boolean(auth))
    if (firstCollectionWithAuth) {
      sanitizedConfig.admin.user = firstCollectionWithAuth.slug
    } else {
      sanitizedConfig.admin.user = defaultUserCollection.slug
      sanitizedConfig.collections.push(defaultUserCollection)
    }
  }

  const userCollection = sanitizedConfig.collections.find(
    ({ slug }) => slug === sanitizedConfig.admin.user,
  )
  if (!userCollection || !userCollection.auth) {
    throw new InvalidConfiguration(
      `${sanitizedConfig.admin.user} is not a valid admin user collection`,
    )
  }

  return sanitizedConfig as unknown as Partial<SanitizedConfig>
}

export const sanitizeConfig = async (incomingConfig: Config): Promise<SanitizedConfig> => {
  const configWithDefaults: Config = merge(defaults, incomingConfig, {
    isMergeableObject: isPlainObject,
  }) as Config

  if (!configWithDefaults?.serverURL) {
    configWithDefaults.serverURL = ''
  }

  const config: Partial<SanitizedConfig> = sanitizeAdminConfig(configWithDefaults)

  if (config.localization && config.localization.locales?.length > 0) {
    // clone localization config so to not break everything
    const firstLocale = config.localization.locales[0]
    if (typeof firstLocale === 'string') {
      config.localization.localeCodes = [
        ...(config.localization as unknown as LocalizationConfigWithNoLabels).locales,
      ]

      // is string[], so convert to Locale[]
      config.localization.locales = (
        config.localization as unknown as LocalizationConfigWithNoLabels
      ).locales.map((locale) => ({
        code: locale,
        label: locale,
        rtl: false,
        toString: () => locale,
      }))
    } else {
      // is Locale[], so convert to string[] for localeCodes
      config.localization.localeCodes = config.localization.locales.reduce((locales, locale) => {
        locales.push(locale.code)
        return locales
      }, [] as string[])

      config.localization.locales = (
        config.localization as LocalizationConfigWithLabels
      ).locales.map((locale) => ({
        ...locale,
        toString: () => locale.code,
      }))
    }
  }

  const i18nConfig: SanitizedConfig['i18n'] = {
    fallbackLanguage: 'en',
    supportedLanguages: {
      en,
    },
    translations: {},
  }

  if (incomingConfig?.i18n) {
    i18nConfig.supportedLanguages =
      incomingConfig.i18n?.supportedLanguages || i18nConfig.supportedLanguages

    const supportedLangKeys = <AcceptedLanguages[]>Object.keys(i18nConfig.supportedLanguages)
    const fallbackLang = incomingConfig.i18n?.fallbackLanguage || i18nConfig.fallbackLanguage

    i18nConfig.fallbackLanguage = supportedLangKeys.includes(fallbackLang)
      ? fallbackLang
      : supportedLangKeys[0]
    i18nConfig.translations = incomingConfig.i18n?.translations || i18nConfig.translations
  }

  config.i18n = i18nConfig

  configWithDefaults.collections.push(getPreferencesCollection(config as unknown as Config))
  configWithDefaults.collections.push(migrationsCollection)

  const richTextSanitizationPromises: Array<(config: SanitizedConfig) => Promise<void>> = []
  for (let i = 0; i < config.collections.length; i++) {
    config.collections[i] = await sanitizeCollection(
      config as unknown as Config,
      config.collections[i],
      richTextSanitizationPromises,
    )
  }

  checkDuplicateCollections(config.collections)

  if (config.globals.length > 0) {
    config.globals = await sanitizeGlobals(
      config as unknown as Config,
      richTextSanitizationPromises,
    )
  }

  if (config.serverURL !== '') {
    config.csrf.push(config.serverURL)
  }

  // Get deduped list of upload adapters
  if (!config.upload) config.upload = { adapters: [] }
  config.upload.adapters = Array.from(
    new Set(config.collections.map((c) => c.upload?.adapter).filter(Boolean)),
  )

  /*
    Execute richText sanitization
   */
  if (typeof incomingConfig.editor === 'function') {
    config.editor = await incomingConfig.editor({
      config: config as SanitizedConfig,
    })
  }

  const promises: Promise<void>[] = []
  for (const sanitizeFunction of richTextSanitizationPromises) {
    promises.push(sanitizeFunction(config as SanitizedConfig))
  }
  await Promise.all(promises)

  return config as SanitizedConfig
}
