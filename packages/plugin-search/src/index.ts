import type { CollectionAfterChangeHook, Config } from '@ruya.sa/payload'

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
      const labels = Object.fromEntries(
        collections
          .filter(({ slug }) => incomingPluginConfig.collections?.includes(slug))
          .map((collection) => [collection.slug, collection.labels]),
      )

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

          const enabledCollections = pluginConfig.collections || []
          const isEnabled = enabledCollections.indexOf(collection.slug) > -1
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
