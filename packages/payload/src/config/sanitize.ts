import type { AcceptedLanguages } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { deepMergeSimple } from '@payloadcms/translations/utilities'

import type { SanitizedJobsConfig } from '../queues/config/types/index.js'
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
import { addFolderCollections } from '../folders/addFolderCollections.js'
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
import { getQueryPresetsCollection, queryPresetsCollectionSlug } from '../query-presets/config.js'
import { getDefaultJobsCollection, jobsCollectionSlug } from '../queues/config/index.js'
import { flattenBlock } from '../utilities/flattenAllFields.js'
import { getSchedulePublishTask } from '../versions/schedule/job.js'
import { addDefaultsToConfig } from './defaults.js'
import { setupOrderable } from './orderable/index.js'

const sanitizeAdminConfig = (configToSanitize: Config): Partial<SanitizedConfig> => {
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

  // add default user collection if none provided
  if (!sanitizedConfig?.admin?.user) {
    const firstCollectionWithAuth = sanitizedConfig.collections!.find(({ auth }) => Boolean(auth))

    if (firstCollectionWithAuth) {
      sanitizedConfig.admin!.user = firstCollectionWithAuth.slug
    } else {
      sanitizedConfig.admin!.user = defaultUserCollection.slug
      sanitizedConfig.collections!.push(defaultUserCollection)
    }
  }

  const userCollection = sanitizedConfig.collections!.find(
    ({ slug }) => slug === sanitizedConfig.admin!.user,
  )

  if (!userCollection || !userCollection.auth) {
    throw new InvalidConfiguration(
      `${sanitizedConfig.admin!.user} is not a valid admin user collection`,
    )
  }

  if (sanitizedConfig?.admin?.timezones) {
    if (typeof sanitizedConfig?.admin?.timezones?.supportedTimezones === 'function') {
      sanitizedConfig.admin.timezones.supportedTimezones =
        sanitizedConfig.admin.timezones.supportedTimezones({ defaultTimezones })
    }

    if (!sanitizedConfig?.admin?.timezones?.supportedTimezones) {
      sanitizedConfig.admin.timezones.supportedTimezones = defaultTimezones
    }
  } else {
    sanitizedConfig.admin!.timezones = {
      supportedTimezones: defaultTimezones,
    }
  }

  // Timezones supported by the Intl API
  const _internalSupportedTimezones = Intl.supportedValuesOf('timeZone')

  // We're casting here because it's already been sanitised above but TS still thinks it could be a function
  ;(sanitizedConfig.admin!.timezones.supportedTimezones as Timezone[]).forEach((timezone) => {
    if (!_internalSupportedTimezones.includes(timezone.value)) {
      throw new InvalidConfiguration(
        `Timezone ${timezone.value} is not supported by the current runtime via the Intl API.`,
      )
    }
  })

  return sanitizedConfig as unknown as Partial<SanitizedConfig>
}

export const sanitizeConfig = async (incomingConfig: Config): Promise<SanitizedConfig> => {
  const configWithDefaults = addDefaultsToConfig(incomingConfig)

  const sanitizedConfig: Partial<SanitizedConfig> = sanitizeAdminConfig(configWithDefaults)

  // Add orderable fields
  setupOrderable(sanitizedConfig as SanitizedConfig)

  if (!sanitizedConfig.endpoints) {
    sanitizedConfig.endpoints = []
  }

  for (const endpoint of authRootEndpoints) {
    sanitizedConfig.endpoints.push(endpoint)
  }

  if (sanitizedConfig.localization && sanitizedConfig.localization.locales?.length > 0) {
    // clone localization sanitizedConfig so to not break everything
    const firstLocale = sanitizedConfig.localization.locales[0]
    if (typeof firstLocale === 'string') {
      sanitizedConfig.localization.localeCodes = [
        ...(sanitizedConfig.localization as unknown as LocalizationConfigWithNoLabels).locales,
      ]

      // is string[], so convert to Locale[]
      sanitizedConfig.localization.locales = (
        sanitizedConfig.localization as unknown as LocalizationConfigWithNoLabels
      ).locales.map((locale) => ({
        code: locale,
        label: locale,
        rtl: false,
        toString: () => locale,
      }))
    } else {
      // is Locale[], so convert to string[] for localeCodes
      sanitizedConfig.localization.localeCodes = sanitizedConfig.localization.locales.map(
        (locale) => locale.code,
      )

      sanitizedConfig.localization.locales = (
        sanitizedConfig.localization as LocalizationConfigWithLabels
      ).locales.map((locale) => ({
        ...locale,
        toString: () => locale.code,
      }))
    }

    // Default fallback to true if not provided
    sanitizedConfig.localization.fallback = sanitizedConfig.localization?.fallback ?? true
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

  sanitizedConfig.i18n = i18nConfig

  const richTextSanitizationPromises: Array<(sanitizedConfig: SanitizedConfig) => Promise<void>> =
    []

  const schedulePublishCollections: CollectionSlug[] = []

  const queryPresetsCollections: CollectionSlug[] = []

  const schedulePublishGlobals: GlobalSlug[] = []

  const collectionSlugs = new Set<CollectionSlug>()

  await addFolderCollections(sanitizedConfig as unknown as Config)

  const validRelationships = [
    ...(sanitizedConfig.collections?.map((c) => c.slug) ?? []),
    jobsCollectionSlug,
    lockedDocumentsCollectionSlug,
    preferencesCollectionSlug,
  ]

  /**
   * Blocks sanitization needs to happen before collections, as collection/global join field sanitization needs sanitizedConfig.blocks
   * to be populated with the sanitized blocks
   */
  sanitizedConfig.blocks = []

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
        config: incomingConfig,
        existingFieldNames: new Set(),
        fields: sanitizedBlock.fields,
        parentIsLocalized: false,
        richTextSanitizationPromises,
        validRelationships,
      })

      const flattenedSanitizedBlock = flattenBlock({ block })

      sanitizedConfig.blocks.push(flattenedSanitizedBlock)
    }
  }

  for (let i = 0; i < sanitizedConfig.collections!.length; i++) {
    if (collectionSlugs.has(sanitizedConfig.collections![i]!.slug)) {
      throw new DuplicateCollection('slug', sanitizedConfig.collections![i]!.slug)
    }

    collectionSlugs.add(sanitizedConfig.collections![i]!.slug)

    const draftsConfig = sanitizedConfig.collections![i]?.versions?.drafts

    if (typeof draftsConfig === 'object' && draftsConfig.schedulePublish) {
      schedulePublishCollections.push(sanitizedConfig.collections![i]!.slug)
    }

    if (sanitizedConfig.collections![i]!.enableQueryPresets) {
      queryPresetsCollections.push(sanitizedConfig.collections![i]!.slug)

      if (!validRelationships.includes(queryPresetsCollectionSlug)) {
        validRelationships.push(queryPresetsCollectionSlug)
      }
    }

    sanitizedConfig.collections![i] = await sanitizeCollection({
      collectionConfig: sanitizedConfig.collections![i]!,
      config: incomingConfig,
      richTextSanitizationPromises,
      validRelationships,
    })
  }

  if (sanitizedConfig.globals!.length > 0) {
    for (let i = 0; i < sanitizedConfig.globals!.length; i++) {
      const draftsConfig = sanitizedConfig.globals![i]?.versions?.drafts

      if (typeof draftsConfig === 'object' && draftsConfig.schedulePublish) {
        schedulePublishGlobals.push(sanitizedConfig.globals![i]!.slug)
      }

      sanitizedConfig.globals![i] = await sanitizeGlobal({
        config: incomingConfig,
        globalConfig: sanitizedConfig.globals![i]!,
        richTextSanitizationPromises,
        validRelationships,
      })
    }
  }

  if (schedulePublishCollections.length || schedulePublishGlobals.length) {
    ;((sanitizedConfig.jobs ??= {} as SanitizedJobsConfig).tasks ??= []).push(
      getSchedulePublishTask({
        adminUserSlug: sanitizedConfig.admin!.user,
        collections: schedulePublishCollections,
        globals: schedulePublishGlobals,
      }),
    )
  }

  ;(sanitizedConfig.jobs ??= {} as SanitizedJobsConfig).enabled = Boolean(
    (Array.isArray(configWithDefaults.jobs?.tasks) && configWithDefaults.jobs?.tasks?.length) ||
      (Array.isArray(configWithDefaults.jobs?.workflows) &&
        configWithDefaults.jobs?.workflows?.length),
  )

  // Need to add default jobs collection before locked documents collections
  if (sanitizedConfig.jobs.enabled) {
    let defaultJobsCollection = getDefaultJobsCollection(sanitizedConfig as unknown as Config)

    if (typeof sanitizedConfig.jobs.jobsCollectionOverrides === 'function') {
      defaultJobsCollection = sanitizedConfig.jobs.jobsCollectionOverrides({
        defaultJobsCollection,
      })

      const hooks = defaultJobsCollection?.hooks
      // @todo - delete this check in 4.0
      if (hooks && sanitizedConfig?.jobs?.runHooks !== true) {
        for (const [hookKey, hook] of Object.entries(hooks)) {
          const defaultAmount = hookKey === 'afterRead' || hookKey === 'beforeChange' ? 1 : 0
          if (hook.length > defaultAmount) {
            // eslint-disable-next-line no-console
            console.warn(
              `The jobsCollectionOverrides function is returning a collection with an additional ${hookKey} hook defined. These hooks will not run unless the jobs.runHooks option is set to true. Setting this option to true will negatively impact performance.`,
            )
            break
          }
        }
      }
    }
    const sanitizedJobsCollection = await sanitizeCollection({
      collectionConfig: defaultJobsCollection,
      config: incomingConfig,
      richTextSanitizationPromises,
      validRelationships,
    })

    configWithDefaults.collections!.push(sanitizedJobsCollection)
  }

  configWithDefaults.collections!.push(
    await sanitizeCollection({
      collectionConfig: getLockedDocumentsCollection(incomingConfig),
      config: incomingConfig,
      richTextSanitizationPromises,
      validRelationships,
    }),
  )

  configWithDefaults.collections!.push(
    await sanitizeCollection({
      collectionConfig: getPreferencesCollection(incomingConfig),
      config: incomingConfig,
      richTextSanitizationPromises,
      validRelationships,
    }),
  )

  configWithDefaults.collections!.push(
    await sanitizeCollection({
      collectionConfig: migrationsCollection,
      config: incomingConfig,
      richTextSanitizationPromises,
      validRelationships,
    }),
  )

  if (queryPresetsCollections.length > 0) {
    configWithDefaults.collections!.push(
      await sanitizeCollection({
        collectionConfig: getQueryPresetsCollection(incomingConfig),
        config: incomingConfig,
        richTextSanitizationPromises,
        validRelationships,
      }),
    )
  }

  if (sanitizedConfig.serverURL !== '') {
    sanitizedConfig.csrf!.push(sanitizedConfig.serverURL!)
  }

  const uploadAdapters = new Set<string>()
  // interact with all collections
  for (const collection of sanitizedConfig.collections!) {
    // deduped upload adapters
    if (collection.upload?.adapter) {
      uploadAdapters.add(collection.upload.adapter)
    }
  }

  if (!sanitizedConfig.upload) {
    sanitizedConfig.upload = { adapters: [] }
  }

  sanitizedConfig.upload.adapters = Array.from(
    new Set(sanitizedConfig.collections!.map((c) => c.upload?.adapter).filter(Boolean) as string[]),
  )

  // Pass through the email sanitizedConfig as is so adapters don't break
  if (incomingConfig.email) {
    sanitizedConfig.email = incomingConfig.email
  }

  /*
    Execute richText sanitization
   */
  if (typeof incomingConfig.editor === 'function') {
    sanitizedConfig.editor = await incomingConfig.editor({
      config: sanitizedConfig as SanitizedConfig,
      isRoot: true,
      parentIsLocalized: false,
    })
    if (sanitizedConfig.editor.i18n && Object.keys(sanitizedConfig.editor.i18n).length >= 0) {
      sanitizedConfig.i18n.translations = deepMergeSimple(
        sanitizedConfig.i18n.translations,
        sanitizedConfig.editor.i18n,
      )
    }
  }

  const promises: Promise<void>[] = []

  for (const sanitizeFunction of richTextSanitizationPromises) {
    promises.push(sanitizeFunction(sanitizedConfig as SanitizedConfig))
  }

  await Promise.all(promises)

  return sanitizedConfig as SanitizedConfig
}
