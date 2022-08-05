import type { Config } from 'payload/config'
import path from 'path'
import type { Configuration as WebpackConfig } from 'webpack'

export const extendWebpackConfig =
  (config: Config): ((webpackConfig: WebpackConfig) => WebpackConfig) =>
  webpackConfig => {
    const existingWebpackConfig =
      typeof config.admin?.webpack === 'function'
        ? config.admin.webpack(webpackConfig)
        : webpackConfig

    return {
      ...existingWebpackConfig,
      resolve: {
        ...(existingWebpackConfig.resolve || {}),
        alias: {
          ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
          'passport-azure-ad': path.resolve(__dirname, './mocks/passportAzureADMock.js'),
          [path.resolve(__dirname, './endpoints/refresh/index')]: path.resolve(
            __dirname,
            './mocks/getRefreshEndpoint.js',
          ),
        },
      },
    }
  }
