import type { Config } from 'payload/config'
import type { Configuration as WebpackConfig } from 'webpack'

import path from 'path'

export const extendWebpackConfig =
  (config: Config): ((webpackConfig: WebpackConfig) => WebpackConfig) =>
  (webpackConfig) => {
    const existingWebpackConfig =
      typeof config.admin?.webpack === 'function'
        ? config.admin.webpack(webpackConfig)
        : webpackConfig

    return {
      ...existingWebpackConfig,
      resolve: {
        ...(existingWebpackConfig.resolve || {}),
        alias: {
          ...(existingWebpackConfig.resolve?.alias || {}),
          '@payloadcms/plugin-cloud': path.resolve(__dirname, './admin.js'),
        },
      },
    }
  }
