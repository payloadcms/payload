import type { Config } from 'payload/config'

import type { SearchConfig } from './types'

import { generateSearchCollection } from './Search'
import deleteFromSearch from './Search/hooks/deleteFromSearch'
import syncWithSearch from './Search/hooks/syncWithSearch'

const Search =
  (incomingSearchConfig: SearchConfig) =>
  (config: Config): Config => {
    const { collections } = config

    if (collections) {
      const searchConfig: SearchConfig = {
        ...incomingSearchConfig,
        deleteDrafts: true,
        syncDrafts: false,
        // write any config defaults here
      }

      // add afterChange and afterDelete hooks to every search-enabled collection
      const collectionsWithSearchHooks = config?.collections
        ?.map((collection) => {
          const { hooks: existingHooks } = collection

          const enabledCollections = searchConfig.collections || []
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
                      searchConfig,
                    })
                  },
                ],
                afterDelete: [
                  ...(existingHooks?.afterDelete || []), 
                  async (args: any) => {
                    deleteFromSearch({
                      ...args,
                      searchConfig,
                    })
                  },
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
          generateSearchCollection(searchConfig),
        ],
      }
    }

    return config
  }

export default Search
