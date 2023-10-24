import type { Config } from 'payload/config'
import type { PluginOptions } from '../types'
import { getFields } from './fields/getFields'

// This is the admin plugin cloud-storage stubfile.
// It only extends the config that are required by the admin UI.

export const cloudStorage =
  (pluginOptions: PluginOptions) =>
  (incomingConfig: Config): Config => {
    const { collections: allCollectionOptions, enabled } = pluginOptions
    const config = { ...incomingConfig }

    // Return early if disabled. Only webpack config mods are applied.
    if (enabled === false) {
      return config
    }

    return {
      ...config,
      collections: (config.collections || []).map(existingCollection => {
        const options = allCollectionOptions[existingCollection.slug]

        if (options?.adapter) {
          const fields = getFields({
            collection: existingCollection,
            prefix: options.prefix,
          })

          return {
            ...existingCollection,
            fields,
          }
        }

        return existingCollection
      }),
    }
  }
