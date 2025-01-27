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

    const mockModulePath = path.resolve(__dirname, './mocks/mockFile.js')

    const newWebpack = {
      ...existingWebpackConfig,
      resolve: {
        ...(existingWebpackConfig.resolve || {}),
        alias: {
          ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
          [path.resolve(__dirname, './captureException')]: mockModulePath,
          [path.resolve(__dirname, './startSentry')]: mockModulePath,
        },
      },
    }

    return newWebpack
  }
