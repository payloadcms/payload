import type { CollectionAfterChangeHook, Config } from 'payload'

import type { SanitizedSearchPluginConfig, SearchPluginConfig } from './types.js'

import { deleteFromSearch } from './Search/hooks/deleteFromSearch.js'
import { syncWithSearch } from './Search/hooks/syncWithSearch.js'
import { generateSearchCollection } from './Search/index.js'

type CollectionAfterChangeHookArgs = Parameters<CollectionAfterChangeHook>[0]

export const searchPlugin =
  <ConfigTypes = unknown>(incomingPluginConfig: SearchPluginConfig<ConfigTypes>) =>
  (config: Config): Config => {
    const { collections } = config

    // If the user defines `localize` to either true or false, use that
    // Otherwise, set it based on if their config has localization enabled or disabled
    const shouldLocalize =
      typeof incomingPluginConfig.localize === 'boolean'
        ? incomingPluginConfig.localize
        : Boolean(config.localization)
    incomingPluginConfig.localize = shouldLocalize

    if (collections) {
      // O(1) slug lookup for enabled-collection checks; replaces an Array.indexOf in the
      // hook-attachment pass that was O(M) per collection.
      const enabledSlugSet = new Set(incomingPluginConfig.collections ?? [])

      const labels: Record<string, (typeof collections)[number]['labels']> = {}
      for (const collection of collections) {
        if (enabledSlugSet.has(collection.slug)) {
          labels[collection.slug] = collection.labels
        }
      }

      const pluginConfig: SanitizedSearchPluginConfig<ConfigTypes> = {
        // write any config defaults here
        deleteDrafts: true,
        labels,
        reindexBatchSize: incomingPluginConfig?.reindexBatchSize || 50,
        syncDrafts: false,
        ...incomingPluginConfig,
      }

      // add afterChange and afterDelete hooks to every search-enabled collection
      const collectionsWithSearchHooks = config?.collections
        ?.map((collection) => {
          const { hooks: existingHooks } = collection

          const isEnabled = enabledSlugSet.has(collection.slug)
          if (isEnabled) {
            return {
              ...collection,
              hooks: {
                ...collection.hooks,
                afterChange: [
                  ...(existingHooks?.afterChange || []),
                  async (args: CollectionAfterChangeHookArgs) => {
                    await syncWithSearch({
                      ...args,
                      collection: collection.slug,
                      pluginConfig,
                    })
                  },
                ],
                beforeDelete: [
                  ...(existingHooks?.beforeDelete || []),
                  deleteFromSearch(pluginConfig),
                ],
              },
            }
          }

          return collection
        })
        .filter(Boolean)

      return {
        ...config,
        collections: [
          ...(collectionsWithSearchHooks || []),
          generateSearchCollection(pluginConfig),
        ],
      }
    }

    return config
  }
