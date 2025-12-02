import type { CollectionConfig, Config } from 'payload'

import type { ImportExportPluginConfig } from '../types.js'

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
  // Get the base export and import collections
  let baseExportCollection = getExportCollection({ config, pluginConfig })
  let baseImportCollection = getImportCollection({ config, pluginConfig })

  const exportCollections: CollectionConfig[] = []
  const importCollections: CollectionConfig[] = []

  // Process each collection config for custom overrides
  if (pluginConfig.collections && pluginConfig.collections.length > 0) {
    for (const collectionConfig of pluginConfig.collections) {
      // Handle export override - apply to base collection
      if (typeof collectionConfig.export === 'function') {
        const customExport = await collectionConfig.export({ collection: baseExportCollection })
        // If the slug changed, this is a separate collection; otherwise deep merge into base
        if (customExport.slug !== baseExportCollection.slug) {
          exportCollections.push(customExport)
        } else {
          baseExportCollection = customExport
        }
      }

      // Handle import override - apply to base collection
      if (typeof collectionConfig.import === 'function') {
        const customImport = await collectionConfig.import({ collection: baseImportCollection })
        // If the slug changed, this is a separate collection; otherwise deep merge into base
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
