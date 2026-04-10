import type { CollectionConfig, Config } from 'payload'

import type { ImportExportPluginConfig } from '../types.js'

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
 *
 * Note: Per-collection settings (disableJobsQueue, batchSize, etc.) are stored on the
 * target collection's `custom['plugin-import-export']` and looked up dynamically at
 * runtime in the export/import hooks.
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
  // Calculate collection slugs for base export/import collections
  // If pluginConfig.collections is provided, filter by export/import !== false
  // Otherwise, use all config collections
  let baseExportSlugs: string[]
  let baseImportSlugs: string[]

  if (pluginConfig.collections && pluginConfig.collections.length > 0) {
    baseExportSlugs = pluginConfig.collections.filter((c) => c.export !== false).map((c) => c.slug)
    baseImportSlugs = pluginConfig.collections.filter((c) => c.import !== false).map((c) => c.slug)
  } else {
    // Fall back to all collections
    const allSlugs = config.collections?.map((c) => c.slug) || []
    baseExportSlugs = allSlugs
    baseImportSlugs = allSlugs
  }

  let baseExportCollection = getExportCollection({
    collectionSlugs: baseExportSlugs,
    config,
    pluginConfig,
  })
  let baseImportCollection = getImportCollection({
    collectionSlugs: baseImportSlugs,
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
        // Create collection specific to this target collection
        const collection = getExportCollection({
          collectionSlugs: [collectionConfig.slug],
          config,
          exportConfig,
          pluginConfig,
        })

        // Call override once to determine user intent
        const overridden = await exportConfig.overrideCollection({ collection })

        // If the slug changed, this is a separate collection; otherwise it modifies the base
        if (overridden.slug !== baseExportCollection.slug) {
          exportCollections.push(overridden)
          customExportSlugMap.set(collectionConfig.slug, overridden.slug)
        } else {
          // Slug didn't change - merge settings into base collection while preserving all slugs
          baseExportCollection = {
            ...baseExportCollection,
            ...overridden,
            admin: {
              ...baseExportCollection.admin,
              ...overridden.admin,
              custom: {
                ...baseExportCollection.admin?.custom,
                ...overridden.admin?.custom,
                'plugin-import-export': {
                  ...overridden.admin?.custom?.['plugin-import-export'],
                  ...baseExportCollection.admin?.custom?.['plugin-import-export'],
                  // Ensure base collection's slug list is preserved
                  collectionSlugs:
                    baseExportCollection.admin?.custom?.['plugin-import-export']?.collectionSlugs,
                },
              },
            },
          }
        }
      }

      const importConf =
        typeof collectionConfig.import === 'object' ? collectionConfig.import : undefined

      if (importConf?.overrideCollection) {
        // Create collection specific to this target collection
        const collection = getImportCollection({
          collectionSlugs: [collectionConfig.slug],
          importConfig: importConf,
          pluginConfig,
        })

        // Call override once to determine user intent
        const overridden = await importConf.overrideCollection({ collection })

        // If the slug changed, this is a separate collection; otherwise it modifies the base
        if (overridden.slug !== baseImportCollection.slug) {
          importCollections.push(overridden)
          // Map this target collection to its custom import collection
          customImportSlugMap.set(collectionConfig.slug, overridden.slug)
        } else {
          // Slug didn't change - merge settings into base collection while preserving all slugs
          baseImportCollection = {
            ...baseImportCollection,
            ...overridden,
            admin: {
              ...baseImportCollection.admin,
              ...overridden.admin,
              custom: {
                ...baseImportCollection.admin?.custom,
                ...overridden.admin?.custom,
                'plugin-import-export': {
                  ...overridden.admin?.custom?.['plugin-import-export'],
                  ...baseImportCollection.admin?.custom?.['plugin-import-export'],
                  // Ensure base collection's slug list is preserved
                  collectionSlugs:
                    baseImportCollection.admin?.custom?.['plugin-import-export']?.collectionSlugs,
                },
              },
            },
          }
        }
      }
    }
  }

  // Filter out slugs that have custom export/import collections from the base collections
  // Collections with custom collections should ONLY be exportable/importable through those
  const filteredExportSlugs = baseExportSlugs.filter((slug) => !customExportSlugMap.has(slug))
  const filteredImportSlugs = baseImportSlugs.filter((slug) => !customImportSlugMap.has(slug))

  // Update base collections with filtered slugs
  baseExportCollection = {
    ...baseExportCollection,
    admin: {
      ...baseExportCollection.admin,
      custom: {
        ...baseExportCollection.admin?.custom,
        'plugin-import-export': {
          ...baseExportCollection.admin?.custom?.['plugin-import-export'],
          collectionSlugs: filteredExportSlugs,
        },
      },
    },
  }

  baseImportCollection = {
    ...baseImportCollection,
    admin: {
      ...baseImportCollection.admin,
      custom: {
        ...baseImportCollection.admin?.custom,
        'plugin-import-export': {
          ...baseImportCollection.admin?.custom?.['plugin-import-export'],
          collectionSlugs: filteredImportSlugs,
        },
      },
    },
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
