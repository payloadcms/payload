import type { Config } from 'payload/config'

import type { PluginOptions } from './types'

import { getFields } from './fields/getFields'
import { getAfterDeleteHook } from './hooks/afterDelete'
import { getBeforeChangeHook } from './hooks/beforeChange'
import { extendWebpackConfig } from './webpack'

// This plugin extends all targeted collections by offloading uploaded files
// to cloud storage instead of solely storing files locally.

// It is based on an adapter approach, where adapters can be written for any cloud provider.
// Adapters are responsible for providing four actions that this plugin will use:
// 1. handleUpload, 2. handleDelete, 3. generateURL, 4. staticHandler

// Optionally, the adapter can specify any Webpack config overrides if they are necessary.

export const cloudStorage =
  (pluginOptions: PluginOptions) =>
  (incomingConfig: Config): Config => {
    const { collections: allCollectionOptions, enabled } = pluginOptions
    const config = { ...incomingConfig }

    const webpack = extendWebpackConfig({ config: incomingConfig, options: pluginOptions })

    config.admin = {
      ...(config.admin || {}),
      webpack,
    }

    // Return early if disabled. Only webpack config mods are applied.
    if (enabled === false) {
      return config
    }

    const initFunctions: Array<() => void> = []

    return {
      ...config,
      collections: (config.collections || []).map((existingCollection) => {
        const options = allCollectionOptions[existingCollection.slug]

        if (options?.adapter) {
          const adapter = options.adapter({
            collection: existingCollection,
            prefix: options.prefix,
          })

          if (adapter.onInit) initFunctions.push(adapter.onInit)

          const fields = getFields({
            adapter,
            collection: existingCollection,
            disablePayloadAccessControl: options.disablePayloadAccessControl,
            generateFileURL: options.generateFileURL,
            prefix: options.prefix,
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
            fields,
            hooks: {
              ...(existingCollection.hooks || {}),
              afterDelete: [
                ...(existingCollection.hooks?.afterDelete || []),
                getAfterDeleteHook({ adapter, collection: existingCollection }),
              ],
              beforeChange: [
                ...(existingCollection.hooks?.beforeChange || []),
                getBeforeChangeHook({ adapter, collection: existingCollection }),
              ],
            },
            upload: {
              ...(typeof existingCollection.upload === 'object' ? existingCollection.upload : {}),
              disableLocalStorage:
                typeof options.disableLocalStorage === 'boolean'
                  ? options.disableLocalStorage
                  : true,
              handlers,
            },
          }
        }

        return existingCollection
      }),
      onInit: async (payload) => {
        initFunctions.forEach((fn) => fn())
        if (config.onInit) await config.onInit(payload)
      },
    }
  }
