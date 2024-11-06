import type { Config } from 'payload/config'
import type { Configuration as WebpackConfig } from 'webpack'

import path from 'path'

import type { GeneratedAdapter, PluginOptions } from './types'

interface Args {
  config: Config
  options: PluginOptions
}

export const extendWebpackConfig =
  ({ config, options }: Args): ((webpackConfig: WebpackConfig) => WebpackConfig) =>
  (webpackConfig) => {
    const existingWebpackConfig =
      typeof config.admin?.webpack === 'function'
        ? config.admin.webpack(webpackConfig)
        : webpackConfig

    const newConfig: WebpackConfig = {
      ...existingWebpackConfig,
      resolve: {
        ...(existingWebpackConfig.resolve || {}),
        alias: {
          ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
          '@payloadcms/plugin-cloud-storage$': path.resolve(__dirname, './admin/index.js'),
        },
      },
    }

    const modifiedConfig = Object.entries(options.collections).reduce(
      (resultingWebpackConfig, [slug, collectionOptions]) => {
        const matchedCollection = config.collections?.find((coll) => coll.slug === slug)

        if (matchedCollection && typeof collectionOptions.adapter === 'function') {
          const adapter: GeneratedAdapter = collectionOptions.adapter({
            collection: matchedCollection,
          })

          if (adapter.webpack) {
            return adapter.webpack(resultingWebpackConfig)
          }
        } else {
          if (!matchedCollection) {
            throw new Error(
              `plugin-cloud-storage: The collection "${slug}" which you specified in your plugin options does not exist. You can not run payload with this plugin enabled while there are collections specified that do not exist.`,
            )
          } else {
            throw new Error(
              `plugin-cloud-storage: The adapter you specified in your plugin options for collection ${slug} is not a valid function. You can not run payload with this plugin enabled while there are collections specified without a valid adapter`,
            )
          }
        }

        return resultingWebpackConfig
      },
      newConfig,
    )

    return modifiedConfig
  }
