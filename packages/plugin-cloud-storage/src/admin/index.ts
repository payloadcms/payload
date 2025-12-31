import type { Config } from 'payload'

import type { PluginOptions } from '../types.js'

import { getFields } from './fields/getFields.js'

// This is the admin plugin cloud-storage stubfile.
// It only extends the config that are required by the admin UI.

export const cloudStorage =
  (pluginOptions: PluginOptions) =>
  (incomingConfig: Config): Config => {
    const { alwaysInsertFields, collections: allCollectionOptions, enabled } = pluginOptions
    const config = { ...incomingConfig }

    // If disabled and alwaysInsertFields is not true, skip processing
    if (enabled === false && !alwaysInsertFields) {
      return config
    }

    return {
      ...config,
      collections: (config.collections || []).map((existingCollection) => {
        const options = allCollectionOptions[existingCollection.slug]

        // Process if adapter exists OR if alwaysInsertFields is true and this collection is configured
        if (options?.adapter || (alwaysInsertFields && options)) {
          const fields = getFields({
            alwaysInsertFields,
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
