import type { AcceptedLanguages } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { deepMergeSimple } from '@payloadcms/translations/utilities'

import type {
  Config,
  LocalizationConfigWithLabels,
  LocalizationConfigWithNoLabels,
  SanitizedConfig,
  Timezone,
} from './types.js'

import { defaultUserCollection } from '../auth/defaultUser.js'
import { authRootEndpoints } from '../auth/endpoints/index.js'
import { sanitizeCollection } from '../collections/config/sanitize.js'
import { migrationsCollection } from '../database/migrations/migrationsCollection.js'
import { DuplicateCollection, InvalidConfiguration } from '../errors/index.js'
import { defaultTimezones } from '../fields/baseFields/timezone/defaultTimezones.js'
import { sanitizeGlobal } from '../globals/config/sanitize.js'
import {
  baseBlockFields,
  type CollectionSlug,
  formatLabels,
  type GlobalSlug,
  sanitizeFields,
} from '../index.js'
import {
  getLockedDocumentsCollection,
  lockedDocumentsCollectionSlug,
} from '../locked-documents/config.js'
import { getPreferencesCollection, preferencesCollectionSlug } from '../preferences/config.js'
import { getQueryPresetsConfig, queryPresetsCollectionSlug } from '../query-presets/config.js'
import { getDefaultJobsCollection, jobsCollectionSlug } from '../queues/config/index.js'
import { flattenBlock } from '../utilities/flattenAllFields.js'
import { getSchedulePublishTask } from '../versions/schedule/job.js'
import { addDefaultsToConfig } from './defaults.js'
import { setupOrderable } from './orderable/index.js'

const sanitizeAdminConfig = (configToSanitize: Config): SanitizedConfig => {
  const sanitizedConfig = { ...configToSanitize }

  if (configToSanitize?.compatibility?.allowLocalizedWithinLocalized) {
    process.env.NEXT_PUBLIC_PAYLOAD_COMPATIBILITY_allowLocalizedWithinLocalized = 'true'
  }

  // default logging level will be 'error' if not provided
  sanitizedConfig.loggingLevels = {
    Forbidden: 'info',
    Locked: 'info',
    MissingFile: 'info',
    NotFound: 'info',
    ValidationError: 'info',
    ...(sanitizedConfig.loggingLevels || {}),
  }

  const { admin, collections } = sanitizedConfig
  if (!admin) {
    throw new InvalidConfiguration('admin is required')
  }
  if (!collections) {
    throw new InvalidConfiguration('collections is required')
  }

  // add default user collection if none provided
  if (!admin.user) {
    const firstCollectionWithAuth = collections.find(({ auth }) => Boolean(auth))
    if (firstCollectionWithAuth) {
      admin.user = firstCollectionWithAuth.slug
    } else {
      admin.user = defaultUserCollection.slug
      collections.push(defaultUserCollection)
    }
  }

  const userCollection = collections.find(({ slug }) => slug === admin.user)
  if (!userCollection || !userCollection.auth) {
    throw new InvalidConfiguration(`${admin?.user} is not a valid admin user collection`)
  }

  if (admin.timezones) {
    if (typeof admin.timezones?.supportedTimezones === 'function') {
      admin.timezones.supportedTimezones = admin.timezones.supportedTimezones({ defaultTimezones })
    }

    if (!admin.timezones?.supportedTimezones) {
      admin.timezones.supportedTimezones = defaultTimezones
    }
  } else {
    admin.timezones = {
      supportedTimezones: defaultTimezones,
    }
  }
  // Timezones supported by the Intl API
  const _internalSupportedTimezones = Intl.supportedValuesOf('timeZone')

  // We're casting here because it's already been sanitised above but TS still thinks it could be a function
  ;(admin.timezones.supportedTimezones as Timezone[]).forEach((timezone) => {
    if (!_internalSupportedTimezones.includes(timezone.value)) {
      throw new InvalidConfiguration(
        `Timezone ${timezone.value} is not supported by the current runtime via the Intl API.`,
      )
    }
  })

  return sanitizedConfig as unknown as SanitizedConfig
}

export const sanitizeConfig = async (incomingConfig: Config): Promise<SanitizedConfig> => {
  const configWithDefaults = addDefaultsToConfig(incomingConfig)

  const config: Partial<SanitizedConfig> = sanitizeAdminConfig(configWithDefaults)

  // Add orderable fields
  setupOrderable(config as SanitizedConfig)

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
      config.localization.localeCodes = config.localization.locales.map((locale) => locale.code)

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
      : supportedLangKeys[0]!
    i18nConfig.translations =
      (incomingConfig.i18n?.translations as SanitizedConfig['i18n']['translations']) ||
      i18nConfig.translations
  }

  config.i18n = i18nConfig

  const richTextSanitizationPromises: Array<(config: SanitizedConfig) => Promise<void>> = []

  const schedulePublishCollections: CollectionSlug[] = []

  const queryPresetsCollections: CollectionSlug[] = []

  const schedulePublishGlobals: GlobalSlug[] = []

  const collectionSlugs = new Set<CollectionSlug>()

  const { collections } = config
  if (!collections) {
    throw new InvalidConfiguration('collections is required')
  }

  const validRelationships = [
    ...(collections.map((c) => c.slug) ?? []),
    jobsCollectionSlug,
    lockedDocumentsCollectionSlug,
    preferencesCollectionSlug,
  ]

  /**
   * Blocks sanitization needs to happen before collections, as collection/global join field sanitization needs config.blocks
   * to be populated with the sanitized blocks
   */
  config.blocks = []

  if (incomingConfig.blocks?.length) {
    for (const block of incomingConfig.blocks) {
      const sanitizedBlock = block

      if (sanitizedBlock._sanitized === true) {
        continue
      }
      sanitizedBlock._sanitized = true

      sanitizedBlock.fields = sanitizedBlock.fields.concat(baseBlockFields)

      sanitizedBlock.labels = !sanitizedBlock.labels
        ? formatLabels(sanitizedBlock.slug)
        : sanitizedBlock.labels

      sanitizedBlock.fields = await sanitizeFields({
        config: config as unknown as Config,
        existingFieldNames: new Set(),
        fields: sanitizedBlock.fields,
        parentIsLocalized: false,
        richTextSanitizationPromises,
        validRelationships,
      })

      const flattenedSanitizedBlock = flattenBlock({ block })

      config.blocks.push(flattenedSanitizedBlock)
    }
  }

  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i]!
    if (collectionSlugs.has(collection.slug)) {
      throw new DuplicateCollection('slug', collection.slug)
    }

    collectionSlugs.add(collection.slug)

    const draftsConfig = collection.versions?.drafts

    if (typeof draftsConfig === 'object' && draftsConfig.schedulePublish) {
      schedulePublishCollections.push(collection.slug)
    }

    if (collection.enableQueryPresets) {
      queryPresetsCollections.push(collection.slug)

      if (!validRelationships.includes(queryPresetsCollectionSlug)) {
        validRelationships.push(queryPresetsCollectionSlug)
      }
    }

    collections[i] = await sanitizeCollection(
      config as unknown as Config,
      collection,
      richTextSanitizationPromises,
      validRelationships,
    )
  }

  const { globals } = config
  if (!globals) {
    throw new InvalidConfiguration('globals is required')
  }

  if (globals.length > 0) {
    for (let i = 0; i < globals.length; i++) {
      const global = globals[i]!
      const draftsConfig = global.versions?.drafts

      if (typeof draftsConfig === 'object' && draftsConfig.schedulePublish) {
        schedulePublishGlobals.push(global.slug)
      }

      globals[i] = await sanitizeGlobal(
        config as unknown as Config,
        global,
        richTextSanitizationPromises,
        validRelationships,
      )
    }
  }

  const { jobs } = config
  if (!jobs) {
    throw new InvalidConfiguration('jobs is required')
  }

  if (schedulePublishCollections.length > 0 || schedulePublishGlobals.length > 0) {
    if (!Array.isArray(jobs.tasks)) {
      jobs.tasks = []
    }

    jobs.tasks.push(
      getSchedulePublishTask({
        adminUserSlug: config.admin!.user,
        collections: schedulePublishCollections,
        globals: schedulePublishGlobals,
      }),
    )
  }

  const { collections: collectionsWithDefaults } = configWithDefaults
  if (!collectionsWithDefaults) {
    throw new InvalidConfiguration('collections is required')
  }

  // Need to add default jobs collection before locked documents collections
  if (
    (Array.isArray(configWithDefaults.jobs?.tasks) && configWithDefaults.jobs?.tasks?.length) ||
    (Array.isArray(configWithDefaults.jobs?.workflows) &&
      configWithDefaults.jobs?.workflows?.length)
  ) {
    let defaultJobsCollection = getDefaultJobsCollection(config as unknown as Config)

    if (defaultJobsCollection) {
      if (typeof configWithDefaults.jobs.jobsCollectionOverrides === 'function') {
        defaultJobsCollection = configWithDefaults.jobs.jobsCollectionOverrides({
          defaultJobsCollection,
        })

        const hooks = defaultJobsCollection?.hooks
        // @todo - delete this check in 4.0
        if (hooks && config?.jobs?.runHooks !== true) {
          for (const hook in hooks) {
            const defaultAmount = hook === 'afterRead' || hook === 'beforeChange' ? 1 : 0
            if (hooks[hook as keyof typeof hooks]!.length > defaultAmount) {
              console.warn(
                `The jobsCollectionOverrides function is returning a collection with an additional ${hook} hook defined. These hooks will not run unless the jobs.runHooks option is set to true. Setting this option to true will negatively impact performance.`,
              )
              break
            }
          }
        }
      }
      const sanitizedJobsCollection = await sanitizeCollection(
        config as unknown as Config,
        defaultJobsCollection,
        richTextSanitizationPromises,
        validRelationships,
      )

      collectionsWithDefaults.push(sanitizedJobsCollection)
    }
  }

  collectionsWithDefaults.push(
    await sanitizeCollection(
      config as unknown as Config,
      getLockedDocumentsCollection(config as unknown as Config),
      richTextSanitizationPromises,
      validRelationships,
    ),
  )

  collectionsWithDefaults.push(
    await sanitizeCollection(
      config as unknown as Config,
      getPreferencesCollection(config as unknown as Config),
      richTextSanitizationPromises,
      validRelationships,
    ),
  )

  collectionsWithDefaults.push(
    await sanitizeCollection(
      config as unknown as Config,
      migrationsCollection,
      richTextSanitizationPromises,
      validRelationships,
    ),
  )

  if (queryPresetsCollections.length > 0) {
    collectionsWithDefaults.push(
      await sanitizeCollection(
        config as unknown as Config,
        getQueryPresetsConfig(config as unknown as Config),
        richTextSanitizationPromises,
        validRelationships,
      ),
    )
  }

  if (config.serverURL !== '') {
    config.csrf?.push(config.serverURL!)
  }

  // Get deduped list of upload adapters
  if (!config.upload) {
    config.upload = { adapters: [] }
  }

  config.upload.adapters = Array.from(
    new Set(
      collections
        .map((c) => c.upload?.adapter)
        .filter((adapter): adapter is string => Boolean(adapter)),
    )!,
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
