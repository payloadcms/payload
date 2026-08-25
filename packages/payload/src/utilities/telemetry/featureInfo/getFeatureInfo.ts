import type { SanitizedConfig } from '../../../config/types.js'
import type { IncomingDrafts } from '../../../versions/types.js'
import type { FeatureInfo, RichTextFeature } from './types.js'

import { defaultUserCollection } from '../../../auth/defaultUser.js'
import { isUserMenuSettingsGroup } from '../../../config/types.js'

export const getFeatureInfo = (config: SanitizedConfig): FeatureInfo => {
  const telemetryConfig = sanitizeTelemetryConfig(config)

  return Object.assign(
    {},
    ...[
      collectAdminCustomization,
      collectAuthentication,
      collectBasicDenominators,
      collectHierarchy,
      collectI18n,
      collectJobsAndQueues,
      collectOrdering,
      collectPreviewAndLivePreview,
      collectQueryPresets,
      collectTrash,
      collectUploadAndMedia,
      collectVersionsAndDrafts,
      collectRichTextFeatures,
    ].map((collect) => safelyCollect(() => collect(telemetryConfig))),
  )
}

const safelyCollect = (collect: () => FeatureInfo): FeatureInfo => {
  try {
    return collect()
  } catch (_) {
    return {}
  }
}

// sanitization adds 3 system widgets that we need to account for
const SYSTEM_WIDGET_COUNT = 3
const SYSTEM_COLLECTION_SLUGS = [
  'payload-locked-documents',
  'payload-migrations',
  'payload-preferences',
  'payload-query-presets',
]
const SYSTEM_GLOBAL_SLUGS = new Set(['payload-jobs-stats'])

/**
 * Payload adds internal collections, globals and tasks during config sanitization.
 * Remove them from the telemetry view so feature metrics represent user config.
 */
const sanitizeTelemetryConfig = (config: SanitizedConfig): SanitizedConfig => {
  try {
    const collections = config.collections ?? []
    const systemCollectionSlugs = new Set(SYSTEM_COLLECTION_SLUGS)
    const kvCollectionSlug = config.kv?.kvCollection?.slug

    if (kvCollectionSlug) {
      systemCollectionSlugs.add(kvCollectionSlug)
    }

    if (config.jobs?.enabled) {
      // uses SYSTEM_COLLECTION_SLUGS (not the Set) to exclude kv slug from position detection
      const firstCollectionAfterJobs = collections.findIndex(({ slug }) =>
        SYSTEM_COLLECTION_SLUGS.includes(slug),
      )

      if (firstCollectionAfterJobs > 0) {
        systemCollectionSlugs.add(collections[firstCollectionAfterJobs - 1]!.slug)
      } else {
        systemCollectionSlugs.add('payload-jobs')
      }
    }

    const tasks = [...(config.jobs?.tasks ?? [])]

    if (getDraftEntities(config).some(hasScheduledPublishing)) {
      for (let index = tasks.length - 1; index >= 0; index--) {
        if (tasks[index]?.slug === 'schedulePublish') {
          tasks.splice(index, 1)
          break
        }
      }
    }

    return {
      ...config,
      collections: collections.filter(
        (collection) =>
          collection !== defaultUserCollection && !systemCollectionSlugs.has(collection.slug),
      ),
      globals: (config.globals ?? []).filter(({ slug }) => !SYSTEM_GLOBAL_SLUGS.has(slug)),
      jobs: {
        ...config.jobs,
        tasks,
      },
    }
  } catch (_) {
    return config
  }
}

const collectAdminCustomization = (config: SanitizedConfig): FeatureInfo => ({
  adminCustomization: {
    customAdminComponentCount: countRootAdminComponents(config),
    customAdminViewCount: Object.keys(config.admin?.components?.views ?? {}).length,
    customDashboardWidgetCount: Math.max(
      0,
      (config.admin?.dashboard?.widgets?.length ?? 0) - SYSTEM_WIDGET_COUNT,
    ),
  },
})

const collectAuthentication = (config: SanitizedConfig): FeatureInfo => {
  const authCollections = (config.collections ?? []).filter(({ auth }) => Boolean(auth))

  return {
    authentication: {
      apiKeyCollectionCount: authCollections.filter(
        ({ auth }) => isObject(auth) && Boolean(auth.useAPIKey),
      ).length,
      authCollectionCount: authCollections.length,
      customAuthStrategyCount: authCollections.reduce(
        (count, { auth }) =>
          count + (isObject(auth) && Array.isArray(auth.strategies) ? auth.strategies.length : 0),
        0,
      ),
      localAuthDisabledCollectionCount: authCollections.filter(
        ({ auth }) => isObject(auth) && Boolean(auth.disableLocalStrategy),
      ).length,
      sessionsDisabledCollectionCount: authCollections.filter(
        ({ auth }) => isObject(auth) && auth.useSessions === false,
      ).length,
      usernameCollectionCount: authCollections.filter(
        ({ auth }) => isObject(auth) && Boolean(auth.loginWithUsername),
      ).length,
      verifiedCollectionCount: authCollections.filter(
        ({ auth }) => isObject(auth) && Boolean(auth.verify),
      ).length,
    },
  }
}

const collectBasicDenominators = (config: SanitizedConfig): FeatureInfo => ({
  basicDenominators: {
    collectionCount: config.collections?.length ?? 0,
    globalCount: config.globals?.length ?? 0,
  },
})

const collectHierarchy = (config: SanitizedConfig): FeatureInfo => ({
  hierarchyCollectionCount: (config.collections ?? []).filter(({ hierarchy }) => Boolean(hierarchy))
    .length,
})

const collectI18n = (config: SanitizedConfig): FeatureInfo => ({
  i18n: {
    hasCustomAdminTranslations: Object.keys(config.i18n?.translations ?? {}).length > 0,
    supportedAdminLanguageCount: config.i18n?.supportedLanguages
      ? Object.keys(config.i18n.supportedLanguages).length
      : 1,
  },
})

const collectJobsAndQueues = (config: SanitizedConfig): FeatureInfo => {
  const tasks = Array.isArray(config.jobs?.tasks) ? config.jobs.tasks : []
  const workflows = Array.isArray(config.jobs?.workflows) ? config.jobs.workflows : []
  const tasksAndWorkflows = [...tasks, ...workflows]
  const scheduledPublishingEntityCount =
    getDraftEntities(config).filter(hasScheduledPublishing).length

  return {
    jobsAndQueues: {
      jobsAutoRunConfigured: config.jobs?.autoRun !== undefined,
      jobsConcurrencyEnabled: tasksAndWorkflows.some(({ concurrency }) => Boolean(concurrency)),
      jobsEnabled: tasks.length > 0 || workflows.length > 0 || scheduledPublishingEntityCount > 0,
      jobsSchedulingEnabled: tasksAndWorkflows.some(({ schedule }) => Boolean(schedule)),
      taskCount: tasks.length,
      workflowCount: workflows.length,
    },
  }
}

const collectOrdering = (config: SanitizedConfig): FeatureInfo => ({
  orderableCollectionCount: (config.collections ?? []).filter(({ orderable }) => Boolean(orderable))
    .length,
})

const collectPreviewAndLivePreview = (config: SanitizedConfig): FeatureInfo => {
  const collections = config.collections ?? []
  const globals = config.globals ?? []
  const livePreviewCollections = new Set([
    ...(config.admin?.livePreview?.collections ?? []),
    ...collections.filter((c) => c.admin?.livePreview).map((c) => c.slug),
  ])
  const livePreviewGlobals = new Set([
    ...(config.admin?.livePreview?.globals ?? []),
    ...globals.filter((g) => g.admin?.livePreview).map((g) => g.slug),
  ])

  return {
    previewAndLivePreview: {
      livePreviewCollectionCount: collections.filter(({ slug }) => livePreviewCollections.has(slug))
        .length,
      livePreviewGlobalCount: globals.filter(({ slug }) => livePreviewGlobals.has(slug)).length,
      previewCollectionCount: collections.filter(({ admin }) => Boolean(admin?.preview)).length,
      previewGlobalCount: globals.filter(({ admin }) => Boolean(admin?.preview)).length,
    },
  }
}

const collectQueryPresets = (config: SanitizedConfig): FeatureInfo => ({
  queryPresetCollectionCount: (config.collections ?? []).filter(({ enableQueryPresets }) =>
    Boolean(enableQueryPresets),
  ).length,
})

const collectRichTextFeatures = (config: SanitizedConfig): FeatureInfo => {
  const editor: unknown = config.editor
  const features =
    isObject(editor) && isObject(editor.editorConfig) ? editor.editorConfig.features : undefined
  const raw =
    isObject(features) && Array.isArray(features.enabledFeatures) ? features.enabledFeatures : []
  const featureSet = new Set(raw.filter((f): f is string => typeof f === 'string'))
  // per-field editor overrides are not checked; root editor covers the vast majority of projects
  return {
    richTextFeatures: (['blocks', 'table', 'upload', 'relationship'] as const).filter((f) =>
      featureSet.has(f),
    ) as RichTextFeature[],
  }
}

const collectTrash = (config: SanitizedConfig): FeatureInfo => ({
  trashCollectionCount: (config.collections ?? []).filter(({ trash }) => Boolean(trash)).length,
})

const collectUploadAndMedia = (config: SanitizedConfig): FeatureInfo => {
  const collections = config.collections ?? []

  return {
    uploadAndMedia: {
      cropDisabledCollectionCount: collections.filter(
        ({ upload }) => isObject(upload) && upload.crop === false,
      ).length,
      focalPointDisabledCollectionCount: collections.filter(
        ({ upload }) => isObject(upload) && upload.focalPoint === false,
      ).length,
      imageSizesCollectionCount: collections.filter(
        ({ upload }) => isObject(upload) && Boolean(upload.imageSizes?.length),
      ).length,
      mimeRestrictedCollectionCount: collections.filter(
        ({ upload }) => isObject(upload) && Boolean(upload.mimeTypes?.length),
      ).length,
      uploadCollectionCount: collections.filter(({ upload }) => Boolean(upload)).length,
    },
  }
}

const collectVersionsAndDrafts = (config: SanitizedConfig): FeatureInfo => {
  const collections = config.collections ?? []
  const globals = config.globals ?? []
  const draftCollections = collections.filter(hasDrafts)
  const draftGlobals = globals.filter(hasDrafts)
  const draftEntities = [...draftCollections, ...draftGlobals]

  return {
    versionsAndDrafts: {
      autosaveEntityCount: draftEntities.filter(hasAutosave).length,
      draftCollectionCount: draftCollections.length,
      draftGlobalCount: draftGlobals.length,
      scheduledPublishingEntityCount: draftEntities.filter(hasScheduledPublishing).length,
      versionsDisabledCollectionCount: collections.filter(({ versions }) => !versions).length,
      versionsDisabledGlobalCount: globals.filter(({ versions }) => !versions).length,
    },
  }
}

const getDraftEntities = (config: SanitizedConfig) => [
  ...(config.collections ?? []).filter(hasDrafts),
  ...(config.globals ?? []).filter(hasDrafts),
]

const hasDrafts = ({ versions }: { versions?: { drafts?: unknown } | boolean }): boolean =>
  isObject(versions) && Boolean(versions.drafts)

const getDraftOptions = ({
  versions,
}: {
  versions?: { drafts?: boolean | IncomingDrafts } | boolean
}): IncomingDrafts | undefined =>
  isObject(versions) && isObject(versions.drafts) ? versions.drafts : undefined

const hasAutosave = (entity: Parameters<typeof getDraftOptions>[0]): boolean =>
  Boolean(getDraftOptions(entity)?.autosave)

const hasScheduledPublishing = (entity: Parameters<typeof getDraftOptions>[0]): boolean =>
  Boolean(getDraftOptions(entity)?.schedulePublish)

const countRootAdminComponents = (config: SanitizedConfig): number => {
  const admin = config.admin
  const customAvatarCount = Number(
    Boolean(admin?.avatar && typeof admin.avatar === 'object' && admin.avatar.Component),
  )
  const components = admin?.components

  if (!components) {
    return customAvatarCount
  }

  const componentArrays = [
    components.actions,
    components.afterDashboard,
    components.afterLogin,
    components.afterNav,
    components.afterNavLinks,
    components.beforeDashboard,
    components.beforeLogin,
    components.beforeNav,
    components.beforeNavLinks,
    components.header,
    components.providers,
    components.settingsMenu,
  ]
  const directComponents = [
    components.graphics?.Icon,
    components.graphics?.Logo,
    components.logout?.Button,
    components.Nav,
  ]
  const hierarchyTabSlugs = new Set(
    (config.collections ?? [])
      .filter(({ hierarchy }) => Boolean(hierarchy))
      .map(({ slug }) => `hierarchy-${slug}`),
  )
  const sidebarTabComponentCount =
    components.sidebar?.tabs?.reduce((count, tab) => {
      if (hierarchyTabSlugs.has(tab.slug)) {
        return count
      }

      return count + Number(Boolean(tab.components.Content)) + Number(Boolean(tab.components.Icon))
    }, 0) ?? 0
  const userMenuComponentCount =
    components.userMenuSettingsItems?.reduce(
      (count, item) => count + (isUserMenuSettingsGroup(item) ? item.items.length : 1),
      0,
    ) ?? 0

  return (
    customAvatarCount +
    componentArrays.reduce((count, items) => count + (items?.length ?? 0), 0) +
    directComponents.filter(Boolean).length +
    sidebarTabComponentCount +
    userMenuComponentCount
  )
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object'
