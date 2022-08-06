import type { Config } from 'payload/config'
import { extendWebpackConfig } from './webpack'
import type { PluginOptions } from './types'
import { getBeforeChangeHook } from './hooks/beforeChange'
import { getAfterDeleteHook } from './hooks/afterDelete'
import { getFields } from './fields/getFields'

// This plugin extends all targeted collections by offloading uploaded files
// to cloud storage instead of solely storing files locally.

// It is based on an adapter approach, where adapters can be written for any cloud provider.
// Adapters are responsible for providing three actions that this plugin will use:
// 1. handleUpload, 2. handleDelete, 3. generateURL

// Optionally, the adapter can specify any Webpack config overrides if they are necessary.

export const cloudStorage =
  (pluginOptions: PluginOptions) =>
  (config: Config): Config => {
    const { collections: allCollectionOptions } = pluginOptions

    return {
      ...config,
      admin: {
        webpack: extendWebpackConfig({ options: pluginOptions, config }),
      },
      collections: (config.collections || []).map(existingCollection => {
        const options = allCollectionOptions.find(({ slug }) => slug === existingCollection.slug)

        if (options) {
          const adapter = options.adapter({ collection: existingCollection })

          const fields = getFields({
            collection: existingCollection,
            adapter,
          })

          return {
            ...existingCollection,
            upload: {
              ...(typeof existingCollection.upload === 'object' ? existingCollection.upload : {}),
              disableLocalStorage:
                typeof options.disableLocalStorage === 'boolean'
                  ? options.disableLocalStorage
                  : true,
            },
            hooks: {
              ...(existingCollection.hooks || {}),
              beforeChange: [
                ...(existingCollection.hooks?.beforeChange || []),
                getBeforeChangeHook({ adapter, collection: existingCollection }),
              ],
              afterDelete: [
                ...(existingCollection.hooks?.afterDelete || []),
                getAfterDeleteHook({ adapter, collection: existingCollection }),
              ],
            },
            fields,
          }
        }

        return existingCollection
      }),
    }
  }
