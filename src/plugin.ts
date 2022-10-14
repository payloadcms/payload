import type { Config } from 'payload/config'
import { extendWebpackConfig } from './webpack'
import type { PluginOptions } from './types'
import { getBeforeChangeHook } from './hooks/beforeChange'
import { getAfterDeleteHook } from './hooks/afterDelete'
import { getFields } from './fields/getFields'

// This plugin extends all targeted collections by offloading uploaded files
// to cloud storage instead of solely storing files locally.

// It is based on an adapter approach, where adapters can be written for any cloud provider.
// Adapters are responsible for providing four actions that this plugin will use:
// 1. handleUpload, 2. handleDelete, 3. generateURL, 4. staticHandler

// Optionally, the adapter can specify any Webpack config overrides if they are necessary.

export const cloudStorage =
  (pluginOptions: PluginOptions) =>
  (config: Config): Config => {
    const { collections: allCollectionOptions } = pluginOptions

    const webpack = extendWebpackConfig({ options: pluginOptions, config })

    const initFunctions: (() => void)[] = []

    return {
      ...config,
      admin: {
        ...(config.admin || {}),
        webpack,
      },
      collections: (config.collections || []).map(existingCollection => {
        const options = allCollectionOptions[existingCollection.slug]

        if (options?.adapter) {
          const adapter = options.adapter({
            collection: existingCollection,
            prefix: options.prefix,
          })

          if (adapter.onInit) initFunctions.push(adapter.onInit)

          const fields = getFields({
            collection: existingCollection,
            disablePayloadAccessControl: options.disablePayloadAccessControl,
            generateFileURL: options.generateFileURL,
            prefix: options.prefix,
            adapter,
          })

          const handlers = [
            ...(typeof existingCollection.upload === 'object' &&
            Array.isArray(existingCollection.upload.handlers)
              ? existingCollection.upload.handlers
              : []),
          ]

          if (!options.disablePayloadAccessControl) {
            handlers.push(adapter.staticHandler)
          }

          return {
            ...existingCollection,
            upload: {
              ...(typeof existingCollection.upload === 'object' ? existingCollection.upload : {}),
              handlers,
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
      onInit: async payload => {
        initFunctions.forEach(fn => fn())
        if (config.onInit) await config.onInit(payload)
      },
    }
  }
