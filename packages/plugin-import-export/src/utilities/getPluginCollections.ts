import type { CollectionConfig, Config } from 'payload'

import type { ExportConfig, ImportConfig, ImportExportPluginConfig } from '../types.js'

import { getExportCollection } from '../export/getExportCollection.js'
import { getImportCollection } from '../import/getImportCollection.js'

export type PluginCollectionsResult = {
  /**
   * Map from target collection slug to the export collection slug to use for it.
   * Only contains entries for collections with custom export collection overrides.
   */
  customExportSlugMap: Map<string, string>
  /**
   * Map from target collection slug to the import collection slug to use for it.
   * Only contains entries for collections with custom import collection overrides.
   */
  customImportSlugMap: Map<string, string>
  /**
   * All export collections (base + any per-collection overrides)
   */
  exportCollections: CollectionConfig[]
  /**
   * All import collections (base + any per-collection overrides)
   */
  importCollections: CollectionConfig[]
}

/**
 * Processes the plugin config and returns export/import collections.
 *
 * - Creates the base export and import collections
 * - Applies top-level overrideExportCollection/overrideImportCollection if provided
 * - For each collection in `pluginConfig.collections` that has a function override
 *   for `export` or `import`, applies the override to create customized collections
 * - Applies settings from collections without overrideCollection to the base collection
 *
 * @param config - The Payload config
 * @param pluginConfig - The import/export plugin config
 * @returns Object containing arrays of export and import collections
 */
export const getPluginCollections = async ({
  config,
  pluginConfig,
}: {
  config: Config
  pluginConfig: ImportExportPluginConfig
}): Promise<PluginCollectionsResult> => {
  let baseExportCollection = getExportCollection({
    config,
    pluginConfig,
  })
  let baseImportCollection = getImportCollection({
    config,
    pluginConfig,
  })

  if (
    pluginConfig.overrideExportCollection &&
    typeof pluginConfig.overrideExportCollection === 'function'
  ) {
    baseExportCollection = await pluginConfig.overrideExportCollection({
      collection: baseExportCollection,
    })
  }

  if (
    pluginConfig.overrideImportCollection &&
    typeof pluginConfig.overrideImportCollection === 'function'
  ) {
    baseImportCollection = await pluginConfig.overrideImportCollection({
      collection: baseImportCollection,
    })
  }

  const exportCollections: CollectionConfig[] = []
  const importCollections: CollectionConfig[] = []

  const customExportSlugMap = new Map<string, string>()
  const customImportSlugMap = new Map<string, string>()

  // Process each collection config for custom collection overrides
  if (pluginConfig.collections && pluginConfig.collections.length > 0) {
    for (const collectionConfig of pluginConfig.collections) {
      const exportConfig =
        typeof collectionConfig.export === 'object' ? collectionConfig.export : undefined
      if (exportConfig?.overrideCollection) {
        // Generate a collection with this export config's settings (like disableJobsQueue)
        const collectionWithSettings = getExportCollection({
          config,
          exportConfig,
          pluginConfig,
        })

        const customExport = await exportConfig.overrideCollection({
          collection: collectionWithSettings,
        })

        // If the slug changed, this is a separate collection; otherwise it modifies the base
        if (customExport.slug !== baseExportCollection.slug) {
          // Store the source collection slug so CollectionField can use it as default
          customExport.admin = {
            ...customExport.admin,
            custom: {
              ...customExport.admin?.custom,
              defaultCollectionSlug: collectionConfig.slug,
            },
          }
          exportCollections.push(customExport)
          customExportSlugMap.set(collectionConfig.slug, customExport.slug)
        } else {
          baseExportCollection = customExport
        }
      }

      const importConf =
        typeof collectionConfig.import === 'object' ? collectionConfig.import : undefined
      if (importConf?.overrideCollection) {
        // Generate a collection with this import config's settings (like disableJobsQueue)
        const collectionWithSettings = getImportCollection({
          config,
          importConfig: importConf,
          pluginConfig,
        })

        const customImport = await importConf.overrideCollection({
          collection: collectionWithSettings,
        })

        // If the slug changed, this is a separate collection; otherwise it modifies the base
        if (customImport.slug !== baseImportCollection.slug) {
          // Store the source collection slug so CollectionField can use it as default
          customImport.admin = {
            ...customImport.admin,
            custom: {
              ...customImport.admin?.custom,
              defaultCollectionSlug: collectionConfig.slug,
            },
          }
          importCollections.push(customImport)
          // Map this target collection to its custom import collection
          customImportSlugMap.set(collectionConfig.slug, customImport.slug)
        } else {
          // Full override - replace the base
          baseImportCollection = customImport
        }
      }
    }
  }

  // Apply settings from collections without overrideCollection to the base collection
  // This is done AFTER all overrides so these settings take precedence
  if (pluginConfig.collections && pluginConfig.collections.length > 0) {
    let mergedExportSettings: Partial<ExportConfig> = {}
    let mergedImportSettings: Partial<ImportConfig> = {}

    for (const collectionConfig of pluginConfig.collections) {
      const exportConf =
        typeof collectionConfig.export === 'object' ? collectionConfig.export : undefined
      const importConf =
        typeof collectionConfig.import === 'object' ? collectionConfig.import : undefined

      if (exportConf && !exportConf.overrideCollection) {
        mergedExportSettings = { ...mergedExportSettings, ...exportConf }
      }
      if (importConf && !importConf.overrideCollection) {
        mergedImportSettings = { ...mergedImportSettings, ...importConf }
      }
    }

    if (
      mergedExportSettings.format !== undefined ||
      mergedExportSettings.disableSave !== undefined ||
      mergedExportSettings.disableDownload !== undefined
    ) {
      baseExportCollection = {
        ...baseExportCollection,
        admin: {
          ...baseExportCollection.admin,
          custom: {
            ...baseExportCollection.admin?.custom,
            ...(mergedExportSettings.disableDownload !== undefined && {
              disableDownload: mergedExportSettings.disableDownload,
            }),
            ...(mergedExportSettings.disableSave !== undefined && {
              disableSave: mergedExportSettings.disableSave,
            }),
            ...(mergedExportSettings.format !== undefined && {
              format: mergedExportSettings.format,
            }),
          },
        },
      }
    }
  }

  exportCollections.unshift(baseExportCollection)
  importCollections.unshift(baseImportCollection)

  return {
    customExportSlugMap,
    customImportSlugMap,
    exportCollections,
    importCollections,
  }
}
