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

    return {
      ...existingWebpackConfig,
      resolve: {
        ...(existingWebpackConfig.resolve || {}),
        alias: {
          ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
          '@payloadcms/plugin-stripe': path.resolve(__dirname, './admin.js'),
          express: mockModulePath,
          [path.resolve(__dirname, './hooks/createNewInStripe')]: mockModulePath,
          [path.resolve(__dirname, './hooks/deleteFromStripe')]: mockModulePath,
          [path.resolve(__dirname, './hooks/syncExistingWithStripe')]: mockModulePath,
          [path.resolve(__dirname, './routes/rest')]: mockModulePath,
          [path.resolve(__dirname, './routes/webhooks')]: mockModulePath,
        },
      },
    }
  }
