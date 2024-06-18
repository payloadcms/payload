import type { Config } from 'payload'

import type { SearchPluginConfig } from './types.js'

import { deleteFromSearch } from './Search/hooks/deleteFromSearch.js'
import { syncWithSearch } from './Search/hooks/syncWithSearch.js'
import { generateSearchCollection } from './Search/index.js'

export const searchPlugin =
  (incomingPluginConfig: SearchPluginConfig) =>
  (config: Config): Config => {
    const { collections } = config

    if (collections) {
      const pluginConfig: SearchPluginConfig = {
        ...incomingPluginConfig,
        deleteDrafts: true,
        syncDrafts: false,
        // write any config defaults here
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
                  async (args: any) => {
                    await syncWithSearch({
                      ...args,
                      collection: collection.slug,
                      pluginConfig,
                    })
                  },
                ],
                afterDelete: [...(existingHooks?.afterDelete || []), deleteFromSearch],
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
