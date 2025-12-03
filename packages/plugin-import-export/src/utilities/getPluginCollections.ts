import type { CollectionConfig, Config } from 'payload'

import type { ExportConfig, ImportConfig, ImportExportPluginConfig } from '../types.js'

import { getExportCollection } from '../export/getExportCollection.js'
import { getImportCollection } from '../import/getImportCollection.js'

export type PluginCollectionsResult = {
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
 * - For each collection in `pluginConfig.collections` that has a function override
 *   for `export` or `import`, applies the override to create customized collections
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
  // Get the base export and import collections with default configs (no per-collection settings)
  let baseExportCollection = getExportCollection({
    config,
    pluginConfig,
  })
  let baseImportCollection = getImportCollection({
    config,
    pluginConfig,
  })

  const exportCollections: CollectionConfig[] = []
  const importCollections: CollectionConfig[] = []

  // Process each collection config for custom collection overrides
  if (pluginConfig.collections && pluginConfig.collections.length > 0) {
    for (const collectionConfig of pluginConfig.collections) {
      // Handle export override - check for overrideCollection function
      const exportConf =
        typeof collectionConfig.export === 'object' ? collectionConfig.export : undefined
      if (exportConf?.overrideCollection) {
        // Generate a collection with this export config's settings (like useJobsQueue)
        const collectionWithSettings = getExportCollection({
          config,
          exportConfig: exportConf,
          pluginConfig,
        })
        // Apply the override on top
        const customExport = await exportConf.overrideCollection({
          collection: collectionWithSettings,
        })
        // If the slug changed, this is a separate collection; otherwise it modifies the base
        if (customExport.slug !== baseExportCollection.slug) {
          exportCollections.push(customExport)
        } else {
          baseExportCollection = customExport
        }
      }

      // Handle import override - check for overrideCollection function
      const importConf =
        typeof collectionConfig.import === 'object' ? collectionConfig.import : undefined
      if (importConf?.overrideCollection) {
        // Generate a collection with this import config's settings (like useJobsQueue)
        const collectionWithSettings = getImportCollection({
          config,
          importConfig: importConf,
          pluginConfig,
        })
        // Apply the override on top
        const customImport = await importConf.overrideCollection({
          collection: collectionWithSettings,
        })
        // If the slug changed, this is a separate collection; otherwise it modifies the base
        if (customImport.slug !== baseImportCollection.slug) {
          importCollections.push(customImport)
        } else {
          baseImportCollection = customImport
        }
      }
    }
  }

  // Add base collections to the front of the arrays
  exportCollections.unshift(baseExportCollection)
  importCollections.unshift(baseImportCollection)

  return {
    exportCollections,
    importCollections,
  }
}
