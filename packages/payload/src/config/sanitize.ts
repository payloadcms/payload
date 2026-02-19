import type { AcceptedLanguages } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { deepMergeSimple } from '@payloadcms/translations/utilities'

import type { CollectionSlug, GlobalSlug, SanitizedCollectionConfig } from '../index.js'
import type { SanitizedJobsConfig } from '../queues/config/types/index.js'
import type {
  Config,
  LocalizationConfigWithLabels,
  LocalizationConfigWithNoLabels,
  SanitizedConfig,
  Timezone,
  WidgetInstance,
} from './types.js'

import { defaultUserCollection } from '../auth/defaultUser.js'
import { authRootEndpoints } from '../auth/endpoints/index.js'
import { sanitizeCollection } from '../collections/config/sanitize.js'
import { migrationsCollection } from '../database/migrations/migrationsCollection.js'
import { DuplicateCollection, InvalidConfiguration } from '../errors/index.js'
import { defaultTimezones } from '../fields/baseFields/timezone/defaultTimezones.js'
import { addFolderSidebarTabs } from '../folders/addFolderSidebarTab.js'
import { sanitizeGlobal } from '../globals/config/sanitize.js'
import { validateHierarchyFields } from '../hierarchy/validateHierarchyFields.js'
import { baseBlockFields, formatLabels, sanitizeFields } from '../index.js'
import {
  getLockedDocumentsCollection,
  lockedDocumentsCollectionSlug,
} from '../locked-documents/config.js'
import { getPreferencesCollection, preferencesCollectionSlug } from '../preferences/config.js'
import { getQueryPresetsConfig, queryPresetsCollectionSlug } from '../query-presets/config.js'
import { getDefaultJobsCollection, jobsCollectionSlug } from '../queues/config/collection.js'
import { getJobStatsGlobal } from '../queues/config/global.js'
import { addHierarchySidebarTabs } from '../taxonomy/addHierarchySidebarTab.js'
import { flattenBlock } from '../utilities/flattenAllFields.js'
import { hasScheduledPublishEnabled } from '../utilities/getVersionsConfig.js'
import { validateTimezones } from '../utilities/validateTimezones.js'
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
  ;(sanitizedConfig.admin!.dashboard ??= { widgets: [] }).widgets.push({
    slug: 'collections',
    ComponentPath: '@payloadcms/next/rsc#CollectionCards',
    minWidth: 'full',
  })
  sanitizedConfig.admin!.dashboard.defaultLayout ??= [
    {
      widgetSlug: 'collections',
      width: 'full',
    } satisfies WidgetInstance,
  ]

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
    if (typeof configToSanitize?.admin?.timezones?.supportedTimezones === 'function') {
      sanitizedConfig.admin.timezones.supportedTimezones =
        configToSanitize.admin.timezones.supportedTimezones({ defaultTimezones })
    }

    if (!sanitizedConfig?.admin?.timezones?.supportedTimezones) {
      sanitizedConfig.admin.timezones.supportedTimezones = defaultTimezones
    }
  } else {
    sanitizedConfig.admin!.timezones = {
      supportedTimezones: defaultTimezones,
    }
  }

  validateTimezones({
    source: 'admin.timezones.supportedTimezones',
    timezones: sanitizedConfig.admin!.timezones.supportedTimezones as Timezone[],
  })

  return sanitizedConfig as unknown as Partial<SanitizedConfig>
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

  const validRelationships = [
    ...(config.collections?.map((c) => c.slug) ?? []),
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

  for (let i = 0; i < config.collections!.length; i++) {
    if (collectionSlugs.has(config.collections![i]!.slug)) {
      throw new DuplicateCollection('slug', config.collections![i]!.slug)
    }

    collectionSlugs.add(config.collections![i]!.slug)

    const draftsConfig = config.collections![i]?.versions?.drafts

    if (typeof draftsConfig === 'object' && draftsConfig.schedulePublish) {
      schedulePublishCollections.push(config.collections![i]!.slug)
    }

    if (config.collections![i]!.enableQueryPresets) {
      queryPresetsCollections.push(config.collections![i]!.slug)

      if (!validRelationships.includes(queryPresetsCollectionSlug)) {
        validRelationships.push(queryPresetsCollectionSlug)
      }
    }

    config.collections![i] = await sanitizeCollection(
      config as unknown as Config,
      config.collections![i]!,
      richTextSanitizationPromises,
      validRelationships,
    )
  }

  if (config.globals!.length > 0) {
    for (let i = 0; i < config.globals!.length; i++) {
      if (hasScheduledPublishEnabled(config.globals![i]!)) {
        schedulePublishGlobals.push(config.globals![i]!.slug)
      }

      config.globals![i] = await sanitizeGlobal(
        config as unknown as Config,
        config.globals![i]!,
        richTextSanitizationPromises,
        validRelationships,
      )
    }
  }

  // Validate hierarchy fields exist in related collections and build sanitized config
  validateHierarchyFields(config as unknown as Config)

  // Add sidebar tabs for hierarchy collections (tags/taxonomy)
  addHierarchySidebarTabs(config as unknown as Config)

  if (schedulePublishCollections.length || schedulePublishGlobals.length) {
    ;((config.jobs ??= {} as SanitizedJobsConfig).tasks ??= []).push(
      getSchedulePublishTask({
        adminUserSlug: config.admin!.user,
        collections: schedulePublishCollections,
        globals: schedulePublishGlobals,
      }),
    )
  }

  ;(config.jobs ??= {} as SanitizedJobsConfig).enabled = Boolean(
    (Array.isArray(configWithDefaults.jobs?.tasks) && configWithDefaults.jobs?.tasks?.length) ||
      (Array.isArray(configWithDefaults.jobs?.workflows) &&
        configWithDefaults.jobs?.workflows?.length),
  )

  // Need to add default jobs collection before locked documents collections
  if (config.jobs.enabled) {
    // Check for schedule property in both tasks and workflows
    const hasScheduleProperty =
      (config?.jobs?.tasks?.length && config.jobs.tasks.some((task) => task.schedule)) ||
      (config?.jobs?.workflows?.length &&
        config.jobs.workflows.some((workflow) => workflow.schedule))

    if (hasScheduleProperty) {
      config.jobs.scheduling = true
      // Add payload-jobs-stats global for tracking when a job of a specific slug was last run
      ;(config.globals ??= []).push(
        await sanitizeGlobal(
          config as unknown as Config,
          getJobStatsGlobal(config as unknown as Config),
          richTextSanitizationPromises,
          validRelationships,
        ),
      )

      config.jobs.stats = true
    }

    let defaultJobsCollection = getDefaultJobsCollection(config.jobs)

    if (typeof config.jobs.jobsCollectionOverrides === 'function') {
      defaultJobsCollection = config.jobs.jobsCollectionOverrides({
        defaultJobsCollection,
      })

      const hooks = defaultJobsCollection?.hooks
      // @todo - delete this check in 4.0
      if (hooks && config?.jobs?.runHooks !== true) {
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
    const sanitizedJobsCollection = await sanitizeCollection(
      config as unknown as Config,
      defaultJobsCollection,
      richTextSanitizationPromises,
      validRelationships,
    )

    ;(config.collections ??= []).push(sanitizedJobsCollection)
  }

  // Add sidebar tabs for folder collections
  addFolderSidebarTabs(config as unknown as Config)

  const lockedDocumentsCollection = getLockedDocumentsCollection(config as unknown as Config)

  if (lockedDocumentsCollection) {
    configWithDefaults.collections!.push(
      await sanitizeCollection(
        config as unknown as Config,
        lockedDocumentsCollection,
        richTextSanitizationPromises,
        validRelationships,
      ),
    )
  }

  configWithDefaults.collections!.push(
    await sanitizeCollection(
      config as unknown as Config,
      getPreferencesCollection(config as unknown as Config),
      richTextSanitizationPromises,
      validRelationships,
    ),
  )

  const migrations = await sanitizeCollection(
    config as unknown as Config,
    migrationsCollection,
    richTextSanitizationPromises,
    validRelationships,
  )

  // @ts-expect-error indexSortableFields is only valid for @payloadcms/db-mongodb
  if (config?.db?.indexSortableFields) {
    migrations.indexes = [
      {
        fields: ['batch', 'name'],
        unique: false,
      },
    ]
  }
  configWithDefaults.collections!.push(migrations)

  if (queryPresetsCollections.length > 0) {
    configWithDefaults.collections!.push(
      await sanitizeCollection(
        config as unknown as Config,
        getQueryPresetsConfig(config as unknown as Config),
        richTextSanitizationPromises,
        validRelationships,
      ),
    )
  }

  if (config.serverURL !== '') {
    config.csrf!.push(config.serverURL!)
  }

  const uploadAdapters = new Set<string>()
  // interact with all collections
  for (const collection of config.collections!) {
    // deduped upload adapters
    if (collection.upload?.adapter) {
      uploadAdapters.add(collection.upload.adapter)
    }
  }

  if (!config.upload) {
    config.upload = { adapters: [] }
  }

  config.upload.adapters = Array.from(
    new Set(config.collections!.map((c) => c.upload?.adapter).filter(Boolean) as string[]),
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
