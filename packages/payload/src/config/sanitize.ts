import type { AcceptedLanguages } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { deepMergeSimple } from '@payloadcms/translations/utilities'

import type { CollectionSlug, GlobalSlug } from '../index.js'
import type {
  Config,
  LocalizationConfigWithLabels,
  LocalizationConfigWithNoLabels,
  SanitizedConfig,
} from './types.js'

import { defaultUserCollection } from '../auth/defaultUser.js'
import { authRootEndpoints } from '../auth/endpoints/index.js'
import { sanitizeCollection } from '../collections/config/sanitize.js'
import { migrationsCollection } from '../database/migrations/migrationsCollection.js'
import { DuplicateCollection, InvalidConfiguration } from '../errors/index.js'
import { sanitizeGlobal } from '../globals/config/sanitize.js'
import { getLockedDocumentsCollection } from '../lockedDocuments/lockedDocumentsCollection.js'
import getPreferencesCollection from '../preferences/preferencesCollection.js'
import { getDefaultJobsCollection } from '../queues/config/jobsCollection.js'
import { getSchedulePublishTask } from '../versions/schedule/job.js'
import { defaults } from './defaults.js'

const sanitizeAdminConfig = (configToSanitize: Config): Partial<SanitizedConfig> => {
  const sanitizedConfig = { ...configToSanitize }

  // default logging level will be 'error' if not provided
  sanitizedConfig.loggingLevels = {
    Forbidden: 'info',
    Locked: 'info',
    MissingFile: 'info',
    NotFound: 'info',
    ValidationError: 'info',
    ...(sanitizedConfig.loggingLevels || {}),
  }

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
  const configWithDefaults = {
    ...defaults,
    ...incomingConfig,
    admin: {
      ...defaults.admin,
      ...incomingConfig?.admin,
      meta: {
        ...defaults.admin.meta,
        ...incomingConfig?.admin?.meta,
      },
      routes: {
        ...defaults.admin.routes,
        ...incomingConfig?.admin?.routes,
      },
    },
    graphQL: {
      ...defaults.graphQL,
      ...incomingConfig?.graphQL,
    },
    jobs: {
      ...defaults.jobs,
      ...incomingConfig?.jobs,
      access: {
        ...defaults.jobs.access,
        ...incomingConfig?.jobs?.access,
      },
      tasks: incomingConfig?.jobs?.tasks || [],
      workflows: incomingConfig?.jobs?.workflows || [],
    },
    routes: {
      ...defaults.routes,
      ...incomingConfig?.routes,
    },
    typescript: {
      ...defaults.typescript,
      ...incomingConfig?.typescript,
    },
  }

  if (!configWithDefaults?.serverURL) {
    configWithDefaults.serverURL = ''
  }

  if (process.env.NEXT_BASE_PATH) {
    if (!incomingConfig?.routes?.api) {
      // check for incomingConfig, as configWithDefaults will always have a default value for routes.api
      configWithDefaults.routes.api = process.env.NEXT_BASE_PATH + '/api'
    }
  }

  const config: Partial<SanitizedConfig> = sanitizeAdminConfig(configWithDefaults)

  if (!config.endpoints) {
    config.endpoints = []
  }

  for (const endpoint of authRootEndpoints) {
    config.endpoints.push(endpoint)
  }

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

    // Default fallback to true if not provided
    config.localization.fallback = config.localization?.fallback ?? true
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
    i18nConfig.translations =
      (incomingConfig.i18n?.translations as SanitizedConfig['i18n']['translations']) ||
      i18nConfig.translations
  }

  config.i18n = i18nConfig

  const richTextSanitizationPromises: Array<(config: SanitizedConfig) => Promise<void>> = []

  const schedulePublishCollections: CollectionSlug[] = []
  const schedulePublishGlobals: GlobalSlug[] = []

  const collectionSlugs = new Set<CollectionSlug>()

  for (let i = 0; i < config.collections.length; i++) {
    if (collectionSlugs.has(config.collections[i].slug)) {
      throw new DuplicateCollection('slug', config.collections[i].slug)
    }

    collectionSlugs.add(config.collections[i].slug)

    const draftsConfig = config.collections[i]?.versions?.drafts

    if (typeof draftsConfig === 'object' && draftsConfig.schedulePublish) {
      schedulePublishCollections.push(config.collections[i].slug)
    }

    config.collections[i] = await sanitizeCollection(
      config as unknown as Config,
      config.collections[i],
      richTextSanitizationPromises,
    )
  }

  if (config.globals.length > 0) {
    for (let i = 0; i < config.globals.length; i++) {
      const draftsConfig = config.globals[i]?.versions?.drafts

      if (typeof draftsConfig === 'object' && draftsConfig.schedulePublish) {
        schedulePublishGlobals.push(config.globals[i].slug)
      }

      config.globals[i] = await sanitizeGlobal(
        config as unknown as Config,
        config.globals[i],
        richTextSanitizationPromises,
      )
    }
  }

  if (schedulePublishCollections.length > 0 || schedulePublishGlobals.length > 0) {
    if (!Array.isArray(configWithDefaults.jobs?.tasks)) {
      configWithDefaults.jobs.tasks = []
    }

    configWithDefaults.jobs.tasks.push(
      getSchedulePublishTask({
        adminUserSlug: config.admin.user,
        collections: schedulePublishCollections,
        globals: schedulePublishGlobals,
      }),
    )
  }

  // Need to add default jobs collection before locked documents collections
  if (
    (Array.isArray(configWithDefaults.jobs?.tasks) && configWithDefaults.jobs?.tasks?.length) ||
    (Array.isArray(configWithDefaults.jobs?.workflows) &&
      configWithDefaults.jobs?.workflows?.length)
  ) {
    let defaultJobsCollection = getDefaultJobsCollection(config as unknown as Config)

    if (typeof configWithDefaults.jobs.jobsCollectionOverrides === 'function') {
      defaultJobsCollection = configWithDefaults.jobs.jobsCollectionOverrides({
        defaultJobsCollection,
      })
    }

    const sanitizedJobsCollection = await sanitizeCollection(
      config as unknown as Config,
      defaultJobsCollection,
      richTextSanitizationPromises,
    )

    configWithDefaults.collections.push(sanitizedJobsCollection)
  }

  configWithDefaults.collections.push(
    await sanitizeCollection(
      config as unknown as Config,
      getLockedDocumentsCollection(config as unknown as Config),
      richTextSanitizationPromises,
    ),
  )
  configWithDefaults.collections.push(
    await sanitizeCollection(
      config as unknown as Config,
      getPreferencesCollection(config as unknown as Config),
      richTextSanitizationPromises,
    ),
  )
  configWithDefaults.collections.push(
    await sanitizeCollection(
      config as unknown as Config,
      migrationsCollection,
      richTextSanitizationPromises,
    ),
  )

  if (config.serverURL !== '') {
    config.csrf.push(config.serverURL)
  }

  // Get deduped list of upload adapters
  if (!config.upload) {
    config.upload = { adapters: [] }
  }

  config.upload.adapters = Array.from(
    new Set(config.collections.map((c) => c.upload?.adapter).filter(Boolean)),
  )

  // Pass through the email config as is so adapters don't break
  if (incomingConfig.email) {
    config.email = incomingConfig.email
  }

  /*
    Execute richText sanitization
   */
  if (typeof incomingConfig.editor === 'function') {
    config.editor = await incomingConfig.editor({
      config: config as SanitizedConfig,
      isRoot: true,
      parentIsLocalized: false,
    })
    if (config.editor.i18n && Object.keys(config.editor.i18n).length >= 0) {
      config.i18n.translations = deepMergeSimple(config.i18n.translations, config.editor.i18n)
    }
  }

  const promises: Promise<void>[] = []
  for (const sanitizeFunction of richTextSanitizationPromises) {
    promises.push(sanitizeFunction(config as SanitizedConfig))
  }
  await Promise.all(promises)

  return config as SanitizedConfig
}
