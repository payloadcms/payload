import type { Config } from 'payload'

import { deepMergeSimple } from 'payload'

import type { PluginDefaultTranslationsObject } from './translations/types.js'
import type {
  ExportAfterHook,
  ExportBeforeHook,
  FieldBeforeExportHook,
  FieldBeforeImportHook,
  ImportAfterHook,
  ImportBeforeHook,
  ImportExportPluginConfig,
  Limit,
  PluginCollectionConfig,
} from './types.js'

import { getCreateCollectionExportTask } from './export/getCreateExportCollectionTask.js'
import { getCreateCollectionImportTask } from './import/getCreateImportCollectionTask.js'
import { translations } from './translations/index.js'
import { collectDisabledFieldPaths } from './utilities/collectDisabledFieldPaths.js'
import { getPluginCollections } from './utilities/getPluginCollections.js'

/**
 * Adds CSV/JSON import and export functionality to selected collections.
 *
 * Registers two upload collections (`exports`, `imports`) that drive the admin
 * UI flow, plus the `createCollectionExport` and `createCollectionImport` jobs
 * that run the work asynchronously. Per-collection settings (batch size, limits,
 * format, lifecycle hooks, override) live on each entry of `collections`.
 *
 * @see https://payloadcms.com/docs/plugins/import-export
 */
export const importExportPlugin =
  (pluginConfig: ImportExportPluginConfig) =>
  async (config: Config): Promise<Config> => {
    // Get all export/import collections and the mappings from target collections to custom collections
    const { customExportSlugMap, customImportSlugMap, exportCollections, importCollections } =
      await getPluginCollections({
        config,
        pluginConfig,
      })

    // Base collections are at index 0 (always present)
    const baseExportCollection = exportCollections[0]!
    const baseImportCollection = importCollections[0]!

    // Collect all export and import collection slugs for filtering
    const allExportSlugs = new Set(exportCollections.map((c) => c.slug))
    const allImportSlugs = new Set(importCollections.map((c) => c.slug))

    // Initialize collections array if needed
    if (!config.collections) {
      config.collections = []
    }

    // Push all export/import collections if their slugs don't already exist
    for (const collection of [...exportCollections, ...importCollections]) {
      const slugExists = config.collections.some((c) => c.slug === collection.slug)
      if (!slugExists) {
        config.collections.push(collection)
      }
    }

    // inject custom import export provider
    config.admin = config.admin || {}
    config.admin.components = config.admin.components || {}
    config.admin.components.providers = config.admin.components.providers || []
    config.admin.components.providers.push(
      '@payloadcms/plugin-import-export/rsc#ImportExportProvider',
    )

    // inject the createExport and createImport jobs into the config
    ;((config.jobs ??= {}).tasks ??= []).push(getCreateCollectionExportTask(config))
    config.jobs.tasks.push(getCreateCollectionImportTask(config))

    // Build a map of collection configs for quick lookup
    const collectionConfigMap = new Map<string, PluginCollectionConfig>()
    if (pluginConfig.collections) {
      for (const collectionConfig of pluginConfig.collections) {
        collectionConfigMap.set(collectionConfig.slug, collectionConfig)
      }
    }

    // Determine which collections to add import/export menu items to
    // Exclude all export and import collections
    const collectionsToUpdate = config.collections.filter(
      (c) => !allExportSlugs.has(c.slug) && !allImportSlugs.has(c.slug),
    )

    for (const collection of collectionsToUpdate) {
      // Get the plugin config for this collection (if specified)
      const collectionPluginConfig = collectionConfigMap.get(collection.slug)

      // If collections array is specified but this collection is not in it, skip
      if (
        pluginConfig.collections &&
        pluginConfig.collections.length > 0 &&
        !collectionPluginConfig
      ) {
        continue
      }

      // Determine which export/import collection to use for this collection
      const exportSlugForCollection =
        customExportSlugMap.get(collection.slug) || baseExportCollection.slug
      const importSlugForCollection =
        customImportSlugMap.get(collection.slug) || baseImportCollection.slug

      // Check if export/import are disabled for this collection
      const exportDisabled = collectionPluginConfig?.export === false
      const importDisabled = collectionPluginConfig?.import === false

      if (!collection.admin) {
        collection.admin = { components: { listMenuItems: [] } }
      }
      const components = collection.admin.components || {}
      if (!components.listMenuItems) {
        components.listMenuItems = []
      }

      // Add export menu item if not disabled
      if (!exportDisabled) {
        components.listMenuItems.push({
          clientProps: {
            collectionSlug: collection.slug,
            exportCollectionSlug: exportSlugForCollection,
          },
          path: '@payloadcms/plugin-import-export/rsc#ExportListMenuItem',
        })
      }

      // Add import menu item if not disabled
      if (!importDisabled) {
        components.listMenuItems.push({
          clientProps: {
            collectionSlug: collection.slug,
            importCollectionSlug: importSlugForCollection,
          },
          path: '@payloadcms/plugin-import-export/rsc#ImportListMenuItem',
        })
      }

      // Find fields explicitly marked as disabled for import/export
      const disabledFieldAccessors = collectDisabledFieldPaths(collection.fields)

      const exportConfig =
        typeof collectionPluginConfig?.export === 'object'
          ? collectionPluginConfig.export
          : undefined
      const exportFormat = exportConfig?.format
      const exportDisableJobsQueue = exportConfig?.disableJobsQueue
      const exportBatchSize = exportConfig?.batchSize
      const exportDisableSave = exportConfig?.disableSave
      const exportDisableDownload = exportConfig?.disableDownload

      const importConfig =
        typeof collectionPluginConfig?.import === 'object'
          ? collectionPluginConfig.import
          : undefined
      const importDisableJobsQueue = importConfig?.disableJobsQueue
      const importBatchSize = importConfig?.batchSize

      const exportLimit = exportConfig?.limit ?? pluginConfig.exportLimit
      const exportHooks = exportConfig?.hooks

      const importLimit = importConfig?.limit ?? pluginConfig.importLimit
      const importDefaultVersionStatus = importConfig?.defaultVersionStatus
      const importHooks = importConfig?.hooks

      collection.admin.custom = {
        ...(collection.admin.custom || {}),
        'plugin-import-export': {
          ...(collection.admin.custom?.['plugin-import-export'] || {}),
          disabledFields: disabledFieldAccessors,
          ...(exportFormat !== undefined && { exportFormat }),
          ...(exportDisableSave !== undefined && { disableSave: exportDisableSave }),
          ...(exportDisableDownload !== undefined && { disableDownload: exportDisableDownload }),
        },
      }

      collection.custom = {
        ...(collection.custom || {}),
        'plugin-import-export': {
          ...(collection.custom?.['plugin-import-export'] || {}),
          ...(exportLimit !== undefined && { exportLimit }),
          ...(exportDisableJobsQueue !== undefined && {
            exportDisableJobsQueue,
          }),
          ...(exportBatchSize !== undefined && { exportBatchSize }),
          ...(importLimit !== undefined && { importLimit }),
          ...(importDisableJobsQueue !== undefined && {
            importDisableJobsQueue,
          }),
          ...(importBatchSize !== undefined && { importBatchSize }),
          ...(importDefaultVersionStatus !== undefined && {
            defaultVersionStatus: importDefaultVersionStatus,
          }),
          ...(exportHooks !== undefined && { exportHooks }),
          ...(importHooks !== undefined && { importHooks }),
        },
      }

      collection.admin.components = components
    }

    if (!config.i18n) {
      config.i18n = {}
    }

    /**
     * Merge plugin translations — only for languages the user has enabled.
     * Plugins run before sanitize, so `supportedLanguages` may be undefined; sanitize will
     * default it to `{ en }`, so we mirror that here to avoid merging 30+ unused tables.
     */
    const supportedLanguageKeys = config.i18n?.supportedLanguages
      ? Object.keys(config.i18n.supportedLanguages)
      : ['en']

    const simplifiedTranslations: Record<string, PluginDefaultTranslationsObject> = {}
    for (const lang of supportedLanguageKeys) {
      const entry = translations[lang as keyof typeof translations]
      if (entry) {
        simplifiedTranslations[lang] = entry.translations
      }
    }

    config.i18n = {
      ...config.i18n,
      translations: deepMergeSimple(simplifiedTranslations, config.i18n?.translations ?? {}),
    }

    return config
  }

declare module 'payload' {
  export interface FieldCustom {
    'plugin-import-export'?: {
      /**
       * When `true` the field is **completely excluded** from the import-export plugin:
       * - It will not appear in the "Fields to export" selector.
       * - It is hidden from the preview list when no specific fields are chosen.
       * - Its data is omitted from the final CSV / JSON export.
       * @default false
       */
      disabled?: boolean
      /**
       * Field-level lifecycle hooks for import/export transformations.
       * Works for both CSV and JSON formats.
       */
      hooks?: {
        /**
         * Runs before a field value is exported. Return a transformed value,
         * `undefined` to use default behavior, or mutate `siblingData` to add
         * extra columns at the same level.
         */
        beforeExport?: FieldBeforeExportHook
        /**
         * Runs before a field value is imported. Return the transformed value.
         */
        beforeImport?: FieldBeforeImportHook
      }
    }
  }

  export interface CollectionAdminCustom {
    'plugin-import-export'?: {
      /**
       * Array of collection slugs that this export/import collection can target.
       * Used by CollectionField to populate the dropdown options.
       */
      collectionSlugs?: string[]
      /**
       * Array of field paths that are disabled for import/export.
       * These paths are collected from fields marked with `custom['plugin-import-export'].disabled = true`.
       */
      disabledFields?: string[]
      /**
       * If true, disables the download button in the export preview UI.
       */
      disableDownload?: boolean
      /**
       * If true, disables the save button in the export preview UI.
       */
      disableSave?: boolean
      /**
       * When set, forces exports from this collection to use this format.
       * This value is read from the plugin config's `export.format` option.
       */
      exportFormat?: 'csv' | 'json'
    }
  }

  export interface CollectionCustom {
    /**
     * @internal
     * Server-side storage for resolved plugin config. Users should configure
     * import/export via `importExportPlugin({ collections: [{ slug, export: { ... }, import: { ... } }] })`.
     * These fields are populated automatically and are not part of the public
     * API — the names here intentionally diverge from the user-facing nested
     * `export.hooks` / `import.hooks` config and may change without notice.
     */
    'plugin-import-export'?: {
      /**
       * @internal Default version status for imported documents when _status field is not provided.
       * Only applies to collections with versions enabled.
       * @default 'published'
       */
      defaultVersionStatus?: 'draft' | 'published'
      /**
       * Number of documents to process in each batch during export.
       * @default 100
       */
      exportBatchSize?: number
      /**
       * If true, disables the jobs queue for exports and runs them synchronously.
       * @default false
       */
      exportDisableJobsQueue?: boolean
      /**
       * Lifecycle hooks for export operations. Stored server-side since functions
       * cannot be serialized to the client.
       */
      exportHooks?: { after?: ExportAfterHook; before?: ExportBeforeHook }
      /**
       * Maximum number of documents that can be exported from this collection.
       * Set to 0 for unlimited (default). Can be a number or function.
       * Stored in collection.custom (server-only) since functions cannot be serialized to client.
       */
      exportLimit?: Limit
      /**
       * Number of documents to process in each batch during import.
       * @default 100
       */
      importBatchSize?: number
      /**
       * If true, disables the jobs queue for imports and runs them synchronously.
       * @default false
       */
      importDisableJobsQueue?: boolean
      /**
       * Lifecycle hooks for import operations. Stored server-side since functions
       * cannot be serialized to the client.
       */
      importHooks?: { after?: ImportAfterHook; before?: ImportBeforeHook }
      /**
       * Maximum number of documents that can be imported to this collection.
       * Set to 0 for unlimited (default). Can be a number or function.
       * Stored in collection.custom (server-only) since functions cannot be serialized to client.
       */
      importLimit?: Limit
    }
  }
}
