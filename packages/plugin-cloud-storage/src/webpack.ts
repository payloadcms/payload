import path from 'path'
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
          '@payloadcms/plugin-cloud-storage$': path.resolve(__dirname, './admin/index.js'),
        },
      },
    }

    return Object.entries(options.collections).reduce(
      (resultingWebpackConfig, [slug, collectionOptions]) => {
        const matchedCollection = config.collections?.find(coll => coll.slug === slug)

        if (matchedCollection && typeof collectionOptions.adapter === 'function') {
          const adapter: GeneratedAdapter = collectionOptions.adapter({
            collection: matchedCollection,
          })

          if (adapter.webpack) {
            return adapter.webpack(resultingWebpackConfig)
          }
        }

        return resultingWebpackConfig
      },
      newConfig,
    )
  }
