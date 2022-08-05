import type { Config } from 'payload/config'
import { extendWebpackConfig } from './webpack'
import type { PluginOptions } from './types'

export const cloudStorage =
  (options: PluginOptions) =>
  (config: Config): Config => {
    const { collections: collectionOptions } = options

    return {
      ...config,
      admin: {
        webpack: extendWebpackConfig(config),
      },
      collections: (config.collections || []).map(existingCollection => {
        const cloudStorageOptions = collectionOptions.find(
          ({ slug }) => slug === existingCollection.slug,
        )

        if (cloudStorageOptions) {
          return {
            ...existingCollection,
            hooks: {
              ...(existingCollection.hooks || {}),
            },
          }
        }

        return existingCollection
      }),
    }
  }
