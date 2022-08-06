import type { Config } from 'payload/config'
import type { Configuration as WebpackConfig } from 'webpack'
import type { GeneratedAdapter, PluginOptions } from './types'

interface Args {
  config: Config
  options: PluginOptions
}

export const extendWebpackConfig =
  ({ config, options }: Args): ((webpackConfig: WebpackConfig) => WebpackConfig) =>
  webpackConfig => {
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
        },
      },
    }

    return options.collections.reduce((resultingWebpackConfig, collectionOptions) => {
      const matchedCollection = config.collections?.find(
        ({ slug }) => slug === collectionOptions.slug,
      )

      if (matchedCollection) {
        const adapter: GeneratedAdapter = collectionOptions.adapter({
          collection: matchedCollection,
        })

        if (adapter.webpack) {
          return adapter.webpack(resultingWebpackConfig)
        }
      }

      return resultingWebpackConfig
    }, newConfig)
  }
